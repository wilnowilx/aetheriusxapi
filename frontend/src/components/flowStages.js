// Stage metadata shared between the FlowExplorer panel (DOM) and the
// lazily-loaded FlowScene (WebGL). Kept dependency-free so importing it
// never pulls three.js into the main bundle.
//
// Colors follow the AETHERIUS brand flow (purple -> magenta -> pink):
// value travels through the brand as it moves agent -> data.
export const STAGES = [
  { id: 'agent', label: 'Agent', color: '#c084fc' },
  { id: 'challenge', label: 'Challenge', color: '#a855f7' },
  { id: 'sign', label: 'Sign', color: '#d946ef' },
  { id: 'settle', label: 'Settle', color: '#ec4899' },
  { id: 'data', label: 'Data', color: '#f0abfc' },
]
