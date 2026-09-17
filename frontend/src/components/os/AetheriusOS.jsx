import { useState, useCallback, useRef, useEffect } from 'react';
import Window from './Window';
import MetricsWindow from './MetricsWindow';
import ExplorerWindow from './ExplorerWindow';
import CatalogWindow from './CatalogWindow';
import WikiWindow from './WikiWindow';
import Starfield from './Starfield';
import { CATEGORIES, getCat } from './api';
import './os.css';

/* Window definitions — each app available in the sidebar */
const APPS = [
  { id: 'catalog',   label: 'API Catalog',    icon: '⬡', color: '#a855f7', component: 'catalog', desc: '70+ endpoints' },
  { id: 'explorer',  label: 'Explorer',        icon: '⊕', color: '#ec4899', component: 'explorer', desc: 'Test any API' },
  { id: 'metrics',   label: 'Live Metrics',    icon: '◎', color: '#00f0ff', component: 'metrics', desc: 'Full telemetry' },
  { id: 'network',   label: 'Network Health',  icon: '⏣', color: '#0052FF', component: 'metrics', sub: 'network', desc: 'Latency & uptime' },
  { id: 'defi',      label: 'DeFi Intel',      icon: '◆', color: '#f59e0b', component: 'metrics', sub: 'defi', desc: 'Volume & flow' },
  { id: 'wallet',    label: 'Wallet Intel',    icon: '◇', color: '#d946ef', component: 'metrics', sub: 'wallet', desc: 'Wallet tracking' },
  { id: 'brain',     label: 'QuantumXBrain',   icon: '∿', color: '#d946ef', component: 'metrics', sub: 'brain', desc: 'Pattern analysis' },
  { id: 'wiki',      label: 'Wiki',              icon: '❚', color: '#22d3ee', component: 'wiki', desc: 'Docs EN/ES' },
];

/* Default positions — metrics centered, others cascaded from center */
function getDefaultPos(appId) {
  const cx = typeof window !== 'undefined' ? Math.max(260, (window.innerWidth - 700) / 2) : 300;
  const cy = typeof window !== 'undefined' ? Math.max(50, (window.innerHeight - 480) / 2) : 80;
  const offsets = {
    catalog:  { dx: -80, dy: -40, w: 820, h: 520 },
    explorer: { dx: 0, dy: 0, w: 880, h: 540 },
    metrics:  { dx: 0, dy: 0, w: 700, h: 480 },
    network:  { dx: 60, dy: 30, w: 640, h: 440 },
    defi:     { dx: -30, dy: 50, w: 700, h: 480 },
    wallet:   { dx: 40, dy: -20, w: 640, h: 440 },
    brain:    { dx: -60, dy: 20, w: 640, h: 440 },
    wiki:     { dx: 20, dy: 10, w: 720, h: 480 },
  };
  const o = offsets[appId] || { dx: 0, dy: 0, w: 700, h: 480 };
  return { x: cx + o.dx, y: cy + o.dy, w: o.w, h: o.h };
}

export default function AetheriusOS() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [windows, setWindows] = useState(() => {
    // Auto-open Live Metrics + API Catalog centered
    const mDef = getDefaultPos('metrics');
    const cDef = getDefaultPos('catalog');
    return [
      { id: 1, appId: 'metrics', isMin: false, isMax: false, pos: { x: mDef.x, y: mDef.y } },
      { id: 2, appId: 'catalog', isMin: false, isMax: false, pos: { x: cDef.x, y: cDef.y } },
    ];
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeWindow, setActiveWindow] = useState('catalog');
  const sidebarTimer = useRef(null);

  /* Scroll-based visibility: hide windows when Hero is visible at all.
     We track the HERO element (#hero) — if its bottom is above viewport top, Hero is gone → show OS.
     This is more aggressive than tracking the OS section. */
  useEffect(() => {
    const check = () => {
      const hero = document.getElementById('hero');
      if (!hero) { setIsVisible(true); return; }
      const heroRect = hero.getBoundingClientRect();
      // Show OS windows when hero bottom is above 60% of viewport
      // (user has scrolled past most of the hero)
      const heroGone = heroRect.bottom < window.innerHeight * 0.6;
      setIsVisible(heroGone);
    };
    window.addEventListener('scroll', check, { passive: true });
    check();
    return () => window.removeEventListener('scroll', check);
  }, []);

  /* Show sidebar when OS first becomes visible */
  useEffect(() => {
    setSidebarOpen(isVisible);
  }, [isVisible]);

  /* Open a window — or bring to front if already open */
  const openWindow = useCallback((appId) => {
    setWindows(prev => {
      const existing = prev.find(w => w.appId === appId);
      if (existing) {
        return prev.map(w => w.appId === appId ? { ...w, isMin: false } : w);
      }
      const def = getDefaultPos(appId);
      return [...prev, {
        id: Date.now(),
        appId,
        isMin: false,
        isMax: false,
        pos: { x: def.x + (Math.random() - 0.5) * 30, y: def.y + (Math.random() - 0.5) * 20 },
      }];
    });
    setActiveWindow(appId);
  }, []);

  const closeWindow = useCallback((appId) => {
    setWindows(prev => prev.filter(w => w.appId !== appId));
    setActiveWindow(prev => prev === appId ? null : prev);
  }, []);

  const minimizeWindow = useCallback((appId) => {
    setWindows(prev => prev.map(w => w.appId === appId ? { ...w, isMin: true } : w));
    setActiveWindow(prev => prev === appId ? null : prev);
  }, []);

  const maximizeWindow = useCallback((appId) => {
    setWindows(prev => prev.map(w => w.appId === appId ? { ...w, isMax: !w.isMax } : w));
  }, []);

  /* Sidebar: auto-show on mouse near left edge */
  const onEdgeMove = useCallback((e) => {
    if (e.clientX <= 3) {
      setSidebarOpen(true);
      if (sidebarTimer.current) clearTimeout(sidebarTimer.current);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', onEdgeMove);
    return () => window.removeEventListener('pointermove', onEdgeMove);
  }, [onEdgeMove]);

  const hideSidebar = useCallback(() => {
    sidebarTimer.current = setTimeout(() => setSidebarOpen(false), 2500);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  function LearnBar({ appId }) {
    const LEARN = {
      catalog:  ['How to read this', 'Every card is a live endpoint with its per-call USDC price. Agents discover capabilities here, then pay per request via x402 — no accounts, no keys. Source: verified catalog.'],
      explorer: ['How to read this', 'Test any endpoint live. Unpaid calls return 402 with a machine-readable price; settle to get 200. What you see is exactly what an agent gets.'],
      metrics:  ['How to read this', 'Full server telemetry refreshed every 10s: uptime, calls, 402 challenges, errors, settled USDC volume. Every number traces to /v1/telemetry.'],
      network:  ['How to read this', 'Connection quality, latency distribution and uptime measured against the live VM. Steady pulse means healthy.'],
      defi:     ['How to read this', 'DeFi endpoint usage and flow from live telemetry — yields, TVL, stablecoins, DEX volumes.'],
      wallet:   ['How to read this', 'Wallet tracking: unique wallets, calls per wallet, settled volume. Enriched by /v1/x402/* intelligence.'],
      brain:    ['How to read this', 'Pattern analysis over live request flow: status mix, latency buckets, active routes. Source: /v1/telemetry.'],
    };
    const l = LEARN[appId];
    if (!l) return null;
    return (
      <div style={{ marginTop: 10, background: 'rgba(168,85,247,.06)', border: '1px solid rgba(168,85,247,.18)', borderRadius: 8, padding: '10px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#d946ef', marginBottom: 4 }}>{l[0]}</div>
        <div style={{ fontSize: 12, lineHeight: 1.6, color: '#c5c5d5' }}>{l[1]}</div>
      </div>
    );
  }

  function renderContent(app, expanded) {
    let el;
    switch (app.component) {
      case 'catalog':
        el = <CatalogWindow onSelectEndpoint={() => openWindow('explorer')} />;
        break;
      case 'explorer':
        el = <ExplorerWindow />;
        break;
      case 'wiki':
        el = <WikiWindow />;
        break;
      case 'metrics':
      default:
        el = <MetricsWindow sub={app.sub} />;
        break;
    }
    return <>{el}{expanded && <LearnBar appId={app.id} />}</>;
  }

  function getLabel(appId) {
    const app = APPS.find(a => a.id === appId);
    return app ? app.label : appId;
  }
  function getIcon(appId) {
    const app = APPS.find(a => a.id === appId);
    return app ? app.icon : '◈';
  }

  const openWindows = windows.filter(w => !w.isMin);
  const minimizedWindows = windows.filter(w => w.isMin);

  return (
    <section className="ae-os" id="ae-os" ref={sectionRef}>
      {/* Starfield background */}
      <Starfield className="ae-starfield" />

      {/* Aurora overlays — living space background */}
      <div className="ae-aurora-layer">
        <div className="ae-aurora a1" />
        <div className="ae-aurora a2" />
        <div className="ae-aurora a3" />
        <div className="ae-aurora a4" />
      </div>

      {/* Subtle nebula overlays */}
      <div className="ae-nebula-layer">
        <div className="ae-nebula n1" />
        <div className="ae-nebula n2" />
        <div className="ae-nebula n3" />
      </div>

      {/* Desktop surface */}
      <div className="ae-desktop">
        {isVisible && (<>
          {/* Top bar — minimal, non-intrusive */}
          <div className="ae-topbar">
            <button className="ae-topbar-menu" onClick={toggleSidebar} title="Toggle menu">
              <svg width="18" height="14" viewBox="0 0 18 14">
                <line x1="0" y1="1" x2="18" y2="1" stroke="currentColor" strokeWidth="1.6"/>
                <line x1="0" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.6"/>
                <line x1="0" y1="13" x2="18" y2="13" stroke="currentColor" strokeWidth="1.6"/>
              </svg>
            </button>
            <div className="ae-topbar-brand">
              <svg width="16" height="16" viewBox="0 0 14 14" className="ae-topbar-logo">
                <polygon points="7,1 13,13 1,13" fill="none" stroke="#a855f7" strokeWidth="1.4"/>
                <circle cx="7" cy="9.2" r="1.5" fill="#d946ef"/>
              </svg>
              <span>AETHERIUS</span>
            </div>
            <div className="ae-topbar-status">
              <span className="ae-dot-on" /> OS Active
            </div>
            <div className="ae-topbar-right">
              <a href="#hero" className="ae-topbar-home" title="Back to Home">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </a>
            </div>
          </div>

          {/* Sidebar — slide-in apps panel */}
          <div
            className={`ae-sidebar ${sidebarOpen ? 'open' : ''}`}
            onMouseLeave={hideSidebar}
          >
            <div className="ae-sidebar-title">Applications</div>
            {APPS.map(app => (
              <button
                key={app.id}
                className={`ae-sidebar-item ${activeWindow === app.id ? 'active' : ''}`}
                style={{ '--app-color': app.color }}
                onClick={() => openWindow(app.id)}
              >
                <span className="ae-sidebar-icon">{app.icon}</span>
                <div className="ae-sidebar-text">
                  <span className="ae-sidebar-label">{app.label}</span>
                  <span className="ae-sidebar-desc">{app.desc}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Windows */}
          {openWindows.map(win => {
            const def = getDefaultPos(win.appId);
            return (
              <Window
                key={win.id}
                id={win.appId}
                title={getLabel(win.appId)}
                icon={getIcon(win.appId)}
                color={APPS.find(a => a.id === win.appId)?.color}
                x={win.pos.x}
                y={win.pos.y}
                width={def.w}
                height={def.h}
                isMinimized={win.isMin}
                isMaximized={win.isMax}
                onClose={() => closeWindow(win.appId)}
                onMinimize={() => minimizeWindow(win.appId)}
                onMaximize={() => maximizeWindow(win.appId)}
              >
                {renderContent(APPS.find(a => a.id === win.appId), win.isMax)}
              </Window>
            );
          })}

          {/* Dock — floating pill at bottom */}
          {(openWindows.length > 0 || minimizedWindows.length > 0) && (
            <div className="ae-dock">
              {APPS.map(app => {
                const win = windows.find(w => w.appId === app.id);
                if (!win) return null;
                return (
                  <button
                    key={app.id}
                    className={`ae-dock-item ${win.isMin ? 'minimized' : 'open'} ${activeWindow === app.id ? 'active' : ''}`}
                    style={{ '--dock-color': app.color }}
                    onClick={() => win.isMin ? openWindow(app.id) : setActiveWindow(app.id)}
                    title={app.label}
                  >
                    <span className="ae-dock-icon">{app.icon}</span>
                    <span className="ae-dock-label">{app.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </>)}
      </div>
    </section>
  );
}
