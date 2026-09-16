import { useState, useCallback, useRef, useEffect } from 'react';
import Window from './Window';
import MetricsWindow from './MetricsWindow';
import ExplorerWindow from './ExplorerWindow';
import CatalogWindow from './CatalogWindow';
import { CATEGORIES, getCat } from './api';
import './os.css';

/* Window definitions — each app available in the sidebar */
const APPS = [
  { id: 'catalog',   label: 'API Catalog',    icon: '⬡', color: '#a855f7', component: 'catalog' },
  { id: 'explorer',  label: 'Explorer',        icon: '⊕', color: '#ec4899', component: 'explorer' },
  { id: 'metrics',   label: 'Live Metrics',    icon: '◎', color: '#00f0ff', component: 'metrics' },
  { id: 'network',   label: 'Network Health',  icon: '⏣', color: '#0052FF', component: 'metrics', sub: 'network' },
  { id: 'defi',      label: 'DeFi Intel',      icon: '◆', color: '#f59e0b', component: 'metrics', sub: 'defi' },
  { id: 'wallet',    label: 'Wallet Intel',    icon: '◇', color: '#d946ef', component: 'metrics', sub: 'wallet' },
  { id: 'brain',     label: 'QuantumXBrain',   icon: '∿', color: '#d946ef', component: 'metrics', sub: 'brain' },
];

/* Default positions for each window when first opened */
const DEFAULT_POS = {
  catalog:  { x: 230, y: 50,  w: 820, h: 520 },
  explorer: { x: 250, y: 60,  w: 880, h: 540 },
  metrics:  { x: 240, y: 55,  w: 700, h: 480 },
  network:  { x: 235, y: 70,  w: 640, h: 440 },
  defi:     { x: 245, y: 65,  w: 700, h: 480 },
  wallet:   { x: 260, y: 55,  w: 640, h: 440 },
  brain:    { x: 230, y: 50,  w: 640, h: 440 },
};

export default function AetheriusOS() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [windows, setWindows] = useState(() => {
    // Auto-open Live Metrics on first mount so the OS isn't empty
    return [{
      id: 1, appId: 'metrics', isMin: false, isMax: false,
      pos: { x: 200, y: 80 },
    }];
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeWindow, setActiveWindow] = useState('metrics');
  const sidebarTimer = useRef(null);

  /* IntersectionObserver: only show fixed elements when OS is mostly in viewport */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        // Only show when OS is 40%+ visible AND its top half is in viewport
        const rect = entry.boundingClientRect;
        const inView = entry.isIntersecting && entry.intersectionRatio > 0.35 && rect.top < window.innerHeight * 0.6;
        setIsVisible(inView);
      },
      { threshold: [0, 0.1, 0.2, 0.35, 0.5, 0.75, 1] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* Show sidebar when OS first becomes visible, keep it until user closes */
  useEffect(() => {
    if (isVisible) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  }, [isVisible]);

  /* Open a window — or bring to front if already open */
  const openWindow = useCallback((appId) => {
    setWindows(prev => {
      const existing = prev.find(w => w.appId === appId);
      if (existing) {
        return prev.map(w => w.appId === appId
          ? { ...w, isMin: false }
          : w
        );
      }
      const def = DEFAULT_POS[appId] || { x: 200, y: 100, w: 700, h: 480 };
      return [...prev, {
        id: Date.now(),
        appId,
        isMin: false,
        isMax: false,
        pos: { x: def.x + Math.random() * 40, y: def.y + Math.random() * 30 },
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

  /* Sidebar: auto-show on mouse near left edge, auto-hide after delay */
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
    sidebarTimer.current = setTimeout(() => setSidebarOpen(false), 1800);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  /* Render window content based on appId */
  function renderContent(app) {
    switch (app.component) {
      case 'catalog':
        return <CatalogWindow onSelectEndpoint={(route) => { openWindow('explorer'); }} />;
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
      {/* Plasma background blobs */}
      <div className="ae-os-plasma">
        <div className="ae-plasma-blob b1" />
        <div className="ae-plasma-blob b2" />
        <div className="ae-plasma-blob b3" />
      </div>

      {/* Desktop surface */}
      <div className="ae-desktop">
        {isVisible && (<>
          {/* Top bar */}
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
              <span className="ae-topbar-label">AETHERIUS OS v1.0</span>
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
                className="ae-sidebar-item"
                style={{ '--app-color': app.color }}
                onClick={() => { openWindow(app.id); }}
              >
                <span className="ae-sidebar-icon">{app.icon}</span>
                <span className="ae-sidebar-label">{app.label}</span>
              </button>
            ))}
          </div>

          {/* Windows */}
          {openWindows.map(win => {
            const app = APPS.find(a => a.id === win.appId);
            const def = DEFAULT_POS[win.appId] || { x: 200, y: 100, w: 700, h: 480 };
            return (
              <Window
                key={win.id}
                id={win.appId}
                title={getLabel(win.appId)}
                icon={getIcon(win.appId)}
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
                {renderContent(app)}
              </Window>
            );
          })}

          {/* Dock */}
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
