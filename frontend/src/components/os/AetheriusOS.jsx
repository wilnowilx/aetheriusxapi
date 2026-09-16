import { useState, useCallback, useRef, useEffect } from 'react';
import Window from './Window';
import MetricsWindow from './MetricsWindow';
import ExplorerWindow from './ExplorerWindow';
import CatalogWindow from './CatalogWindow';
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
  };
  const o = offsets[appId] || { dx: 0, dy: 0, w: 700, h: 480 };
  return { x: cx + o.dx, y: cy + o.dy, w: o.w, h: o.h };
}

export default function AetheriusOS() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [windows, setWindows] = useState(() => {
    // Auto-open Live Metrics centered
    const def = getDefaultPos('metrics');
    return [{
      id: 1, appId: 'metrics', isMin: false, isMax: false,
      pos: { x: def.x, y: def.y },
    }];
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeWindow, setActiveWindow] = useState('metrics');
  const sidebarTimer = useRef(null);

  /* Scroll-based visibility: show fixed elements only when Hero is NOT the primary view */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const check = () => {
      const rect = el.getBoundingClientRect();
      const topInView = rect.top < window.innerHeight * 0.55;
      const fillsEnough = rect.height > 0 && (rect.bottom - Math.max(0, rect.top)) / window.innerHeight > 0.35;
      setIsVisible(topInView && fillsEnough);
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

  function renderContent(app) {
    switch (app.component) {
      case 'catalog':
        return <CatalogWindow onSelectEndpoint={() => openWindow('explorer')} />;
      case 'explorer':
        return <ExplorerWindow />;
      case 'metrics':
      default:
        return <MetricsWindow sub={app.sub} />;
    }
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
                {renderContent(APPS.find(a => a.id === win.appId))}
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
