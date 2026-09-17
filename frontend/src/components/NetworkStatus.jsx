import React, { useEffect, useState } from 'react'
import { useReputationStream } from '../hooks/useReputationStream'

export function NetworkStatus() {
  const { connected, online, chainId, error, switchToBase, reconnect } = useReputationStream()
  const [showDetails, setShowDetails] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  const isCorrectChain = chainId === 8453
  const isOnline = online // WebSocket connected OR REST polling active

  useEffect(() => {
    if (error && !isOnline) {
      const timer = setTimeout(() => {
        reconnect()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, isOnline, reconnect])

  if (!window.ethereum && !isOnline) {
    return (
      <div className="network-status offline">
        <div className="status-indicator">
          <span className="dot offline" />
          <span>No Wallet</span>
        </div>
        <div className="status-message">
          Install MetaMask or a Web3 wallet to connect to Base Mainnet
        </div>
      </div>
    )
  }

  return (
    <div className={`network-status ${isOnline ? 'connected' : 'connecting'}`}>
      <button
        className="status-trigger"
        onClick={() => setShowDetails(!showDetails)}
        aria-expanded={showDetails}
      >
        <div className="status-indicator">
          <span className={`dot ${isOnline ? 'connected' : 'connecting'}`} />
          <span className="status-text">
            {isOnline ? 'Base Mainnet' : 'Connecting...'}
          </span>
        </div>
        <span className="chevron">{showDetails ? '▲' : '▼'}</span>
      </button>

      {showDetails && (
        <div className="status-panel">
          <div className="status-row">
            <span className="label">Network</span>
            <span className={`value ${isCorrectChain ? 'correct' : 'wrong'}`}>
              {chainId ? `Chain ID: ${chainId}` : 'Detecting...'}
            </span>
          </div>

          <div className="status-row">
            <span className="label">Status</span>
            <span className={`value ${isOnline ? 'connected' : 'disconnected'}`}>
              {isOnline ? '● Connected' : '○ Disconnected'}
            </span>
          </div>

          <div className="status-row">
            <span className="label">Events</span>
            <span className="value">{isOnline ? 'Streaming' : 'Waiting...'}</span>
          </div>

          {!isCorrectChain && chainId && (
            <button
              className="switch-network-btn"
              onClick={async () => {
                setIsSwitching(true)
                await switchToBase()
                setIsSwitching(false)
              }}
              disabled={isSwitching}
            >
              {isSwitching ? 'Switching...' : 'Switch to Base Mainnet'}
            </button>
          )}

          {!isOnline && (
            <button className="reconnect-btn" onClick={reconnect}>
              Reconnect
            </button>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NetworkStatus