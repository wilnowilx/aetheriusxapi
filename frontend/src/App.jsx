import React, { useEffect, useRef } from 'react'
import Hero from './components/Hero'

// === NAV ===
function Nav() {
  const [scrolled, setScrolled] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      <nav className={scrolled ? 'scrolled' : ''}>
        <div className="nav-wrap">
          <a href="#hero" className="brand">AETHERIUS</a>
          <div className="nav-links">
            <a href="#categories">APIs</a>
            <a href="#how">How It Works</a>
            <a href="#heartbeat">Status</a>
            <a href="#telemetry">Telemetry</a>
            <a href="dashboard/">Dashboard</a>
            <a href="#cta" className="btn-nav">Get Started</a>
          </div>
          <button className="mobile-toggle" onClick={() => setMobileOpen(true)}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div className="mobile-nav open">
          <button className="close-btn" onClick={() => setMobileOpen(false)}>×</button>
          <a href="#categories" onClick={() => setMobileOpen(false)}>APIs</a>
          <a href="#how" onClick={() => setMobileOpen(false)}>How It Works</a>
          <a href="#heartbeat" onClick={() => setMobileOpen(false)}>Status</a>
          <a href="#telemetry" onClick={() => setMobileOpen(false)}>Telemetry</a>
          <a href="dashboard/" onClick={() => setMobileOpen(false)}>Dashboard</a>
          <a href="#cta" className="btn btn-primary" onClick={() => setMobileOpen(false)}>Get Started</a>
        </div>
      )}
    </>
  )
}

// === PLASMA BACKGROUND ===
function PlasmaBg() {
  return (
    <div className="plasma-bg">
      <div className="plasma-blob" style={{ width: 700, height: 700, background: 'radial-gradient(circle, rgba(168,85,247,0.55) 0%, transparent 70%)', top: '-10%', left: '-5%', animationDuration: '16s' }} />
      <div className="plasma-blob" style={{ width: 580, height: 580, background: 'radial-gradient(circle, rgba(217,70,239,0.48) 0%, transparent 70%)', top: '30%', right: '-10%', animationDuration: '13s', animationDelay: '-5s' }} />
      <div className="plasma-blob" style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(236,72,153,0.35) 0%, transparent 70%)', bottom: '10%', left: '20%', animationDuration: '18s', animationDelay: '-10s' }} />
    </div>
  )
}

// === CATEGORIES (API list) ===
function Categories() {
  const cats = [
    { name: 'Maps', icon: '🗺️', endpoints: ['/v1/maps/search', '/v1/maps/reviews'], price: '$0.01-0.02' },
    { name: 'Crypto', icon: '₿', endpoints: ['/v1/token/price', '/v1/token/analyze'], price: '$0.005-0.01' },
    { name: 'Web', icon: '🌐', endpoints: ['/v1/web/scrape', '/v1/web/whois'], price: '$0.01' },
    { name: 'Data', icon: '📊', endpoints: ['/v1/data/weather', '/v1/data/ip-geo'], price: '$0.005' },
    { name: 'Email', icon: '✉️', endpoints: ['/v1/email/validate'], price: '$0.005' },
    { name: 'QuantumXBrain', icon: '🧠', endpoints: ['/v1/x402/brain', '/v1/x402/market-pulse'], price: 'FREE' },
  ]
  return (
    <section id="categories">
      <div className="inner">
        <div className="section-label">📦 API Categories</div>
        <h2 className="section-title">100+ Endpoints.<br /><span className="grad">One Protocol.</span></h2>
        <p className="section-desc" style={{ marginBottom: 40 }}>Every endpoint accepts x402 micropayments in USDC. Pay per request, no subscriptions.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {cats.map(cat => (
            <div key={cat.name} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: 24, transition: 'border-color 0.3s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{cat.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{cat.name}</div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-sec)' }}>
                {cat.endpoints.map(ep => <div key={ep} style={{ marginBottom: 4 }}>{ep}</div>)}
              </div>
              <div style={{ marginTop: 12, fontSize: '0.8rem', color: cat.price === 'FREE' ? 'var(--green)' : 'var(--purple-light)', fontWeight: 600 }}>
                {cat.price}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// === HOW IT WORKS ===
function HowItWorks() {
  const steps = [
    { num: '01', title: 'Choose an endpoint', desc: 'Browse 100+ APIs — maps, crypto, web scraping, data, QuantumXBrain intelligence.' },
    { num: '02', title: 'Send a request', desc: 'Your agent calls the API with its wallet address. No API keys, no accounts.' },
    { num: '03', title: 'x402 payment', desc: 'The API returns a 402 with a payment challenge. Your agent signs a USDC micropayment on Base.' },
    { num: '04', title: 'Get the data', desc: 'Payment settles in 2 seconds. You get the response. Done.' },
  ]
  return (
    <section id="how">
      <div className="inner">
        <div className="section-label">⚡ How It Works</div>
        <h2 className="section-title">Four Steps to<br /><span className="grad">Agent Commerce</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 24, marginTop: 40 }}>
          {steps.map(step => (
            <div key={step.num} style={{ padding: 24 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '2rem', fontWeight: 800, color: 'var(--purple)', opacity: 0.4, marginBottom: 12 }}>{step.num}</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>{step.title}</div>
              <div style={{ color: 'var(--text-sec)', fontSize: '0.9rem' }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// === CODE EXAMPLE ===
function CodeSection() {
  return (
    <section id="code" style={{ background: 'linear-gradient(180deg, rgba(168,85,247,0.03) 0%, transparent 100%)' }}>
      <div className="inner">
        <div className="section-label">💻 Developer Experience</div>
        <h2 className="section-title">Ship in Minutes,<br /><span className="grad">Not Months</span></h2>
        <div style={{ background: '#0d0d1a', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginTop: 32, fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', lineHeight: 1.8, overflowX: 'auto' }}>
          <div><span style={{ color: '#6b7280' }}># Install the SDK</span></div>
          <div><span style={{ color: 'var(--magenta)' }}>$</span> pip install aetheriusx</div>
          <div style={{ marginTop: 12 }}><span style={{ color: '#6b7280' }}># Initialize with your wallet</span></div>
          <div><span style={{ color: 'var(--magenta)' }}>$</span> python</div>
          <div><span style={{ color: 'var(--purple-light)' }}>&gt;&gt;&gt;</span> <span style={{ color: 'var(--cyan)' }}>from</span> aetheriusx <span style={{ color: 'var(--cyan)' }}>import</span> Client</div>
          <div><span style={{ color: 'var(--purple-light)' }}>&gt;&gt;&gt;</span> client = Client(<span style={{ color: 'var(--green)' }}>"0xYourWallet"</span>)</div>
          <div style={{ marginTop: 12 }}><span style={{ color: '#6b7280' }}># Call any API — payment is automatic</span></div>
          <div><span style={{ color: 'var(--purple-light)' }}>&gt;&gt;&gt;</span> resp = client.get(<span style={{ color: 'var(--green)' }}>"<span style={{ color: 'var(--orange)' }}>/v1/crypto/price</span>"</span>,</div>
          <div style={{ paddingLeft: 40 }}>params={"{"}<span style={{ color: 'var(--green)' }}>"token"</span>: <span style={{ color: 'var(--green)' }}>"ETH"</span>{"}"})</div>
          <div style={{ marginTop: 12 }}><span style={{ color: 'var(--purple-light)' }}>&gt;&gt;&gt;</span> print(resp.data)</div>
          <div><span style={{ color: '#6b7280' }}>{"{"}"price": 2384.50, "change": 2.3{"}"}</span></div>
          <div style={{ marginTop: 12 }}><span style={{ color: 'var(--magenta)' }}>$</span> <span style={{ color: '#6b7280' }}># That's it. Payment handled.</span></div>
        </div>
      </div>
    </section>
  )
}

// === CTA ===
function CTA() {
  return (
    <section id="cta">
      <div className="inner" style={{ textAlign: 'center' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.1) 0%, rgba(217,70,239,0.05) 100%)',
          border: '1px solid rgba(168,85,247,0.2)', borderRadius: 20, padding: '60px 40px'
        }}>
          <h2 className="section-title" style={{ marginBottom: 16 }}>
            Ready to Build the<br /><span className="grad">Agent Economy</span>?
          </h2>
          <p className="section-desc" style={{ margin: '0 auto 32px' }}>Start building today. Health and telemetry free, forever.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://x.com/aetheriusxAPI" className="btn btn-primary">Follow on X ↗</a>
            <a href="https://github.com/wilnowilx/aetheriusxapi" className="btn btn-secondary">View GitHub ↗</a>
          </div>
        </div>
      </div>
    </section>
  )
}

// === DONATEX ===
function DonateX() {
  return (
    <section id="donatex" style={{ padding: '60px 0', textAlign: 'center' }}>
      <div className="inner" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(217,70,239,0.05) 100%)',
          border: '1px solid rgba(168,85,247,0.15)', borderRadius: 16, padding: '40px 32px'
        }}>
          <div className="section-label" style={{ justifyContent: 'center', marginBottom: 8 }}>DonateX</div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>
            <span className="grad">Support Open-Source</span>
          </h3>
          <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem', marginBottom: 20 }}>
            Every donation fuels more open-source infrastructure for the agent economy.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://www.coinbase.com/earn/x402/spend?recipient=0x677B483128D0399bCD0A5AB36eE990C0246d7f61&asset=USDC&network=base&amount=5" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              ❤️ Donate $5 USDC
            </a>
            <a href="https://www.coinbase.com/earn/x402/spend?recipient=0x677B483128D0399bCD0A5AB36eE990C0246d7f61&asset=USDC&network=base&amount=25" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              ⭐ Donate $25 USDC
            </a>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 16, fontFamily: 'JetBrains Mono, monospace' }}>
            Base Mainnet · USDC · 0x677B…7f61
          </p>
        </div>
      </div>
    </section>
  )
}

// === FOOTER ===
function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 0' }}>
      <div className="inner">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <a href="#hero" className="brand">AETHERIUS</a>
          <div style={{ display: 'flex', gap: 24, fontSize: '0.85rem' }}>
            <a href="https://x.com/aetheriusxAPI" target="_blank" rel="noreferrer" style={{ color: 'var(--text-sec)', textDecoration: 'none' }}>X / Twitter</a>
            <a href="https://github.com/wilnowilx/aetheriusxapi" target="_blank" rel="noreferrer" style={{ color: 'var(--text-sec)', textDecoration: 'none' }}>GitHub</a>
            <a href="https://t.me/aetheriusxAPI_global" target="_blank" rel="noreferrer" style={{ color: 'var(--text-sec)', textDecoration: 'none' }}>Telegram</a>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>2026 AETHERIUS. MIT License.</span>
        </div>
      </div>
    </footer>
  )
}

// === APP ===
function App() {
  return (
    <>
      <PlasmaBg />
      <Nav />
      <Hero />
      <Categories />
      <HowItWorks />
      <CodeSection />
      <CTA />
      <DonateX />
      <Footer />
    </>
  )
}

export default App
