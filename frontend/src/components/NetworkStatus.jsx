import React, { useEffect, useState } from 'react'
import { useReputationStream } from '../hooks/useReputationStream'

export function NetworkStatus() {
  const { connected, chainId, error, switchToBase, reconnect } = useReputationStream()
  const [showDetails, setShowDetails] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  const isCorrectChain = chainId === 8453

  useEffect(() => {
    if (error && !connected) {
      const timer = setTimeout(() => {
        reconnect()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, connected, reconnect])

  if (!window.ethereum && !connected) {
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
    <div className={`network-status ${connected ? 'connected' : 'connecting'}`}>
      <button
        className="status-trigger"
        onClick={() => setShowDetails(!showDetails)}
        aria-expanded={showDetails}
      >
        <div className="status-indicator">
          <span className={`dot ${connected ? 'connected' : 'connecting'}`} />
          <span className="status-text">
            {connected ? 'Base Mainnet' : 'Connecting...'}
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
            <span className={`value ${connected ? 'connected' : 'disconnected'}`}>
              {connected ? '● Connected' : '○ Disconnected'}
            </span>
          </div>

          <div className="status-row">
            <span className="label">Events</span>
            <span className="value">{connected ? 'Streaming' : 'Waiting...'}</span>
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

          {!connected && (
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