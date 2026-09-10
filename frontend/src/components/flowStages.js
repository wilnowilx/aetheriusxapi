// Stage metadata shared between the FlowExplorer panel (DOM) and the
// lazily-loaded FlowScene (WebGL). Kept dependency-free so importing it
// never pulls three.js into the main bundle.
export const STAGES = [
  { id: 'agent', label: 'Agent', color: '#06b6d4' },
  { id: 'challenge', label: 'Challenge', color: '#f59e0b' },
  { id: 'sign', label: 'Sign', color: '#a855f7' },
  { id: 'settle', label: 'Settle', color: '#d946ef' },
  { id: 'data', label: 'Data', color: '#10b981' },
]
