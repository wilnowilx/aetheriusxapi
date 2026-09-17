import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { ethers } from 'ethers'

const REPUTATION_ANCHOR_ADDRESS = '0x7d31b0683a46Ad793248A8590f77dF7d1c2b782A'
const BASE_CHAIN_ID = 8453
const BASE_RPC_URL = 'https://mainnet.base.org'

const CONTRACT_ABI = [
  'event Anchored(address indexed agent, uint16 score, bytes32 behaviorRoot, uint64 timestamp)',
  'event BatchAnchored(address[] agents, uint16[] scores, bytes32[] behaviors, uint64 timestamp)'
]

const BEHAVIOR_COLORS = {
  0: '#22d3ee', // neutral/unknown - cyan
  1: '#22c55e', // positive - green
  2: '#ef4444', // negative - red
  3: '#f59e0b', // warning - amber
  4: '#a855f7', // special - purple
  5: '#06b6d4', // system - sky
  6: '#ec4899', // social - pink
  7: '#84cc16'  // growth - lime
}

const DEFAULT_BEHAVIOR_COLOR = '#22d3ee'

const MAX_PARTICLES = 500
const PARTICLE_LIFETIME = 30000 // 30 seconds
const POLL_INTERVAL = 10000 // 10 seconds
const RECONNECT_BASE_DELAY = 1000
const MAX_RECONNECT_DELAY = 30000

function getBehaviorColor(behaviorRoot) {
  if (!behaviorRoot) return DEFAULT_BEHAVIOR_COLOR
  const lastByte = parseInt(behaviorRoot.slice(-2), 16)
  const behaviorType = lastByte % 8
  return BEHAVIOR_COLORS[behaviorType] || DEFAULT_BEHAVIOR_COLOR
}

function createParticle(agent, score, behaviorRoot, timestamp, isBatch = false, index = 0) {
  const normalizedScore = Math.min(Math.max(score / 10000, 0.1), 2.0)
  const color = getBehaviorColor(behaviorRoot)

  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  const radius = 2.2 + Math.random() * 0.3

  return {
    id: `${agent}-${timestamp}-${index}`,
    agent,
    position: [
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    ],
    velocity: [
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02
    ],
    size: 0.02 + normalizedScore * 0.08,
    color,
    score: normalizedScore,
    behaviorRoot,
    timestamp,
    age: 0,
    maxAge: PARTICLE_LIFETIME,
    isBatch,
    trail: []
  }
}

export function useReputationStream() {
  const [events, setEvents] = useState([])
  const [stats, setStats] = useState({
    totalAnchored: 0,
    totalBatchAnchored: 0,
    totalAgents: 0,
    lastEventTime: null,
    avgScore: 0
  })
  const [connected, setConnected] = useState(false)
  const [pollingActive, setPollingActive] = useState(false)
  const [chainId, setChainId] = useState(null)
  const [account, setAccount] = useState(null)
  const [error, setError] = useState(null)

  const providerRef = useRef(null)
  const contractRef = useRef(null)
  const wsProviderRef = useRef(null)
  const listenersRef = useRef({})
  const reconnectTimeoutRef = useRef(null)
  const pollIntervalRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  const isMountedRef = useRef(true)
  const particleBufferRef = useRef([])
  const statsRef = useRef(stats)

  statsRef.current = stats

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    if (wsProviderRef.current) {
      try {
        wsProviderRef.current.removeAllListeners()
        wsProviderRef.current.destroy()
      } catch { }
      wsProviderRef.current = null
    }
    Object.values(listenersRef.current).forEach(fn => {
      try { contractRef.current?.off?.(fn) } catch { }
    })
    listenersRef.current = {}
  }, [])

  const updateStats = useCallback((newEvent) => {
    setStats(prev => {
      const totalEvents = prev.totalAnchored + prev.totalBatchAnchored + 1
      let newTotalAnchored = prev.totalAnchored
      let newTotalBatchAnchored = prev.totalBatchAnchored
      let newTotalAgents = prev.totalAgents
      let newAvgScore = prev.avgScore

      if (newEvent.type === 'Anchored') {
        newTotalAnchored++
        newTotalAgents++
        newAvgScore = (prev.avgScore * (totalEvents - 1) + newEvent.score) / totalEvents
      } else if (newEvent.type === 'BatchAnchored') {
        newTotalBatchAnchored++
        newTotalAgents += newEvent.agents.length
        const batchAvgScore = newEvent.scores.reduce((a, b) => a + b, 0) / newEvent.scores.length
        newAvgScore = (prev.avgScore * (totalEvents - 1) + batchAvgScore) / totalEvents
      }

      return {
        totalAnchored: newTotalAnchored,
        totalBatchAnchored: newTotalBatchAnchored,
        totalAgents: newTotalAgents,
        lastEventTime: newEvent.timestamp,
        avgScore: Math.round(newAvgScore * 100) / 100
      }
    })
  }, [])

  const addParticles = useCallback((newParticles) => {
    particleBufferRef.current = [...particleBufferRef.current, ...newParticles]
    if (particleBufferRef.current.length > MAX_PARTICLES) {
      particleBufferRef.current = particleBufferRef.current.slice(-MAX_PARTICLES)
    }
    setEvents(prev => {
      const updated = [...prev, ...newParticles]
      return updated.slice(-MAX_PARTICLES)
    })
  }, [])

  const handleAnchoredEvent = useCallback((agent, score, behaviorRoot, timestamp, event) => {
    if (!isMountedRef.current) return

    const particle = createParticle(agent, Number(score), behaviorRoot, Number(timestamp))
    addParticles([particle])

    setEvents(prev => [...prev.slice(-499), {
      type: 'Anchored',
      agent,
      score: Number(score),
      behaviorRoot,
      timestamp: Number(timestamp),
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash
    }])

    updateStats({
      type: 'Anchored',
      score: Number(score),
      agents: [agent],
      timestamp: Number(timestamp)
    })
  }, [addParticles, updateStats])

  const handleBatchAnchoredEvent = useCallback((agents, scores, behaviors, timestamp, event) => {
    if (!isMountedRef.current) return

    const particles = agents.map((agent, i) =>
      createParticle(
        agent,
        Number(scores[i]),
        behaviors[i],
        Number(timestamp),
        true,
        i
      )
    )
    addParticles(particles)

    const batchEvent = {
      type: 'BatchAnchored',
      agents: agents.map(a => a.toLowerCase()),
      scores: scores.map(s => Number(s)),
      behaviors,
      timestamp: Number(timestamp),
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash
    }
    setEvents(prev => [...prev.slice(-499), batchEvent])

    updateStats({
      type: 'BatchAnchored',
      agents: agents.map(a => a.toLowerCase()),
      scores: scores.map(s => Number(s)),
      timestamp: Number(timestamp)
    })
  }, [addParticles, updateStats])

  const setupWebSocketListener = useCallback(async () => {
    try {
      // Use public WS RPC — avoids MetaMask/cors issues
      const wsUrl = `wss://base-mainnet.g.alchemy.com/v2/demo`
      wsProviderRef.current = new ethers.WebSocketProvider(wsUrl)

      wsProviderRef.current.on('open', () => {
        console.log('[ReputationStream] WebSocket connected')
        setConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
      })

      wsProviderRef.current.on('close', (code, reason) => {
        console.log('[ReputationStream] WebSocket closed:', code, reason)
        setConnected(false)
        if (isMountedRef.current) {
          scheduleReconnect()
        }
      })

      wsProviderRef.current.on('error', (err) => {
        console.error('[ReputationStream] WebSocket error:', err)
        setError(err.message)
      })

      const wsContract = new ethers.Contract(
        REPUTATION_ANCHOR_ADDRESS,
        CONTRACT_ABI,
        wsProviderRef.current
      )
      contractRef.current = wsContract

      const anchoredFilter = wsContract.filters.Anchored()
      const batchFilter = wsContract.filters.BatchAnchored()

      const anchoredHandler = (...args) => {
        const event = args[args.length - 1]
        handleAnchoredEvent(args[0], args[1], args[2], args[3], event)
      }
      const batchHandler = (...args) => {
        const event = args[args.length - 1]
        handleBatchAnchoredEvent(args[0], args[1], args[2], args[3], event)
      }

      wsContract.on(anchoredFilter, anchoredHandler)
      wsContract.on(batchFilter, batchHandler)

      listenersRef.current.anchored = anchoredHandler
      listenersRef.current.batch = batchHandler

      // ethers v6 WebSocketProvider auto-connects on construction
    } catch (err) {
      console.error('[ReputationStream] WebSocket setup failed:', err)
      setError(err.message)
      if (isMountedRef.current) {
        startPollingFallback()
      }
    }
  }, [handleAnchoredEvent, handleBatchAnchoredEvent])

  const startPollingFallback = useCallback(async () => {
    console.log('[ReputationStream] Starting REST polling fallback')
    setError(prev => prev ? `${prev} | Using REST polling` : 'Using REST polling fallback')
    setPollingActive(true)

    const poll = async () => {
      if (!isMountedRef.current || !providerRef.current) return

      try {
        const httpProvider = new ethers.JsonRpcProvider(BASE_RPC_URL)
        const contract = new ethers.Contract(REPUTATION_ANCHOR_ADDRESS, CONTRACT_ABI, httpProvider)

        const latestBlock = await httpProvider.getBlockNumber()
        const fromBlock = Math.max(0, latestBlock - 100)

        const [anchoredEvents, batchEvents] = await Promise.all([
          contract.queryFilter(contract.filters.Anchored(), fromBlock, latestBlock),
          contract.queryFilter(contract.filters.BatchAnchored(), fromBlock, latestBlock)
        ])

        anchoredEvents.forEach(event => {
          handleAnchoredEvent(event.args.agent, event.args.score, event.args.behaviorRoot, event.args.timestamp, event)
        })

        batchEvents.forEach(event => {
          handleBatchAnchoredEvent(event.args.agents, event.args.scores, event.args.behaviors, event.args.timestamp, event)
        })
      } catch (err) {
        console.error('[ReputationStream] Polling error:', err)
      }
    }

    await poll()
    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL)
  }, [handleAnchoredEvent, handleBatchAnchoredEvent])

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) return

    const delay = Math.min(
      RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttemptsRef.current),
      MAX_RECONNECT_DELAY
    ) + Math.random() * 1000

    reconnectAttemptsRef.current++
    console.log(`[ReputationStream] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null
      if (isMountedRef.current) {
        setupWebSocketListener()
      }
    }, delay)
  }, [setupWebSocketListener])

  const connect = useCallback(async () => {
    // Always use public RPC for on-chain data — avoids MetaMask popup issues
    try {
      providerRef.current = new ethers.JsonRpcProvider(BASE_RPC_URL)
    } catch (err) {
      console.error('[ReputationStream] RPC provider failed:', err)
    }

    // If MetaMask is present, get chain ID silently (no popup)
    if (window.ethereum) {
      try {
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' })
        const currentChainId = parseInt(chainIdHex, 16)
        setChainId(currentChainId)
        if (currentChainId !== BASE_CHAIN_ID) {
          setError(`Wrong network. Please switch to Base Mainnet (chainId: ${BASE_CHAIN_ID})`)
        }
      } catch {
        // Silently ignore — user may not have wallet connected
      }
    }

    await setupWebSocketListener()
  }, [setupWebSocketListener])

  const switchToBase = useCallback(async () => {
    if (!window.ethereum) {
      setError('No wallet detected. Install MetaMask or use a Web3 wallet.')
      return false
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${BASE_CHAIN_ID.toString(16)}` }]
      })
      return true
    } catch (err) {
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${BASE_CHAIN_ID.toString(16)}`,
              chainName: 'Base Mainnet',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: [BASE_RPC_URL],
              blockExplorerUrls: ['https://basescan.org']
            }]
          })
          return true
        } catch (addErr) {
          console.error('[ReputationStream] Add chain failed:', addErr)
          setError('Failed to add Base network')
        }
      } else {
        console.error('[ReputationStream] Switch chain failed:', err)
        setError('Failed to switch to Base network')
      }
      return false
    }
  }, [])

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    cleanup()
    connect()
  }, [cleanup, connect])

  useEffect(() => {
    isMountedRef.current = true
    connect()

    return () => {
      isMountedRef.current = false
      cleanup()
    }
  }, [connect, cleanup])

  const currentParticles = useMemo(() => particleBufferRef.current, [events.length])

  return {
    events: currentParticles,
    stats,
    connected,
    online: connected || pollingActive,
    chainId,
    account,
    error,
    reconnect,
    switchToBase,
    particleBuffer: particleBufferRef.current,
    addParticles
  }
}

export function useReputationParticles() {
  const { particleBuffer } = useReputationStream()

  const [particles, setParticles] = useState([])

  useEffect(() => {
    const frameId = requestAnimationFrame(function update() {
      const now = Date.now()
      const updated = particleBuffer
        .map(p => ({
          ...p,
          age: p.age + 16.67,
          position: [
            p.position[0] + p.velocity[0],
            p.position[1] + p.velocity[1],
            p.position[2] + p.velocity[2]
          ],
          trail: [...p.trail.slice(-10), p.position]
        }))
        .filter(p => p.age < p.maxAge)

      setParticles(updated)
      frameId.current = requestAnimationFrame(update)
    })

    return () => cancelAnimationFrame(frameId)
  }, [particleBuffer])

  return particles
}

export default useReputationStream