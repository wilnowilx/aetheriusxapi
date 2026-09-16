import { useRef, useState, useCallback, useEffect } from 'react';

let zCounter = 90000;

export default function Window({
  id, title, icon, color, children, x = 120, y = 80,
  width = 640, height = 440, minWidth = 320, minHeight = 220,
  onClose, onMinimize, onMaximize, isMinimized = false, isMaximized = false,
}) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x, y });
  const [size, setSize] = useState({ w: width, h: height });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [z, setZ] = useState(++zCounter);
  const dragRef = useRef({ sx: 0, sy: 0, ox: 0, oy: 0 });
  const resizeRef = useRef({ sx: 0, sy: 0, ow: 0, oh: 0 });
  const prevPos = useRef({ x, y });
  const prevSize = useRef({ w: width, h: height });

  const focus = useCallback(() => {
    setZ(++zCounter);
    ref.current?.style.setProperty('z-index', zCounter);
  }, []);

  useEffect(() => {
    ref.current?.style.setProperty('z-index', z);
  }, [z]);

  const onTitleDown = useCallback((e) => {
    if (e.target.closest('button') || isMaximized) return;
    focus();
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
    setDragging(true);
    e.preventDefault();
  }, [pos, isMaximized, focus]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const { sx, sy, ox, oy } = dragRef.current;
      setPos({ x: ox + e.clientX - sx, y: Math.max(0, oy + e.clientY - sy) });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [dragging]);

  const onResizeDown = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    focus();
    resizeRef.current = { sx: e.clientX, sy: e.clientY, ow: size.w, oh: size.h };
    setResizing(true);
  }, [size, focus]);

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e) => {
      const { sx, sy, ow, oh } = resizeRef.current;
      setSize({ w: Math.max(minWidth, ow + e.clientX - sx), h: Math.max(minHeight, oh + e.clientY - sy) });
    };
    const onUp = () => setResizing(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [resizing]);

  const toggleMax = () => {
    if (isMaximized) {
      setPos(prevPos.current);
      setSize(prevSize.current);
    } else {
      prevPos.current = pos;
      prevSize.current = size;
      setPos({ x: 0, y: 0 });
      setSize({ w: window.innerWidth, h: window.innerHeight - 48 });
    }
    onMaximize?.();
  };

  if (isMinimized) return null;

  const style = isMaximized
    ? { left: 0, top: 0, width: '100vw', height: 'calc(100vh - 48px)', zIndex: z }
    : { left: pos.x, top: pos.y, width: size.w, height: size.h, zIndex: z };

  return (
    <div
      ref={ref}
      className="ae-window"
      style={{ ...style, '--win-color': color || '#a855f7' }}
      onPointerDown={focus}
    >
      {/* Title bar */}
      <div
        className={`ae-wintitle ${dragging ? 'dragging' : ''}`}
        onPointerDown={onTitleDown}
        onDoubleClick={toggleMax}
      >
        <span className="ae-win-icon">{icon || '◈'}</span>
        <span className="ae-win-label">{title}</span>
        <div className="ae-win-btns">
          <button className="ae-win-btn min" onPointerDown={(e) => { e.stopPropagation(); onMinimize?.(); }} title="Minimize">
            <svg width="10" height="10" viewBox="0 0 10 10"><line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1.4"/></svg>
          </button>
          <button className={`ae-win-btn max ${isMaximized ? 'active' : ''}`} onPointerDown={(e) => { e.stopPropagation(); toggleMax(); }} title={isMaximized ? "Restore" : "Maximize"}>
            {isMaximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10">
                <rect x="0.5" y="2.5" width="6" height="6" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="3" y="0.5" width="6" height="6" rx="0.8" fill="rgba(12,12,24,0.94)" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1.5" y="1.5" width="7" height="7" rx="1" fill="none" stroke="currentColor" strokeWidth="1.3"/></svg>
            )}
          </button>
          <button className="ae-win-btn close" onPointerDown={(e) => { e.stopPropagation(); onClose?.(); }} title="Close">
            <svg width="10" height="10" viewBox="0 0 10 10"><line x1="1.5" y1="1.5" x2="8.5" y2="8.5" stroke="currentColor" strokeWidth="1.3"/><line x1="8.5" y1="1.5" x2="1.5" y2="8.5" stroke="currentColor" strokeWidth="1.3"/></svg>
          </button>
        </div>
      </div>
      {/* Content */}
      <div className="ae-win-body">{children}</div>
      {/* Resize handle */}
      {!isMaximized && (
        <div className="ae-resize" onPointerDown={onResizeDown}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="2" y1="10" x2="10" y2="2" stroke="rgba(168,85,247,.4)" strokeWidth="1.2"/>
            <line x1="5" y1="10" x2="10" y2="5" stroke="rgba(168,85,247,.3)" strokeWidth="1.2"/>
            <line x1="8" y1="10" x2="10" y2="8" stroke="rgba(168,85,247,.2)" strokeWidth="1.2"/>
          </svg>
        </div>
      )}
    </div>
  );
}
