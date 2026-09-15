import { useState } from 'react';
import { SPECS, CATEGORIES, getCat } from './api';

/* Catalog — visual grid of all endpoints, grouped by category */
export default function CatalogWindow({ onSelectEndpoint }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const routes = Object.keys(SPECS);
  const grouped = {};
  routes.forEach(route => {
    const cat = getCat(route);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(route);
  });

  const filtered = filter === 'all' ? routes : (grouped[filter] || []);
  const displayed = search
    ? filtered.filter(r => r.toLowerCase().includes(search.toLowerCase()))
    : filtered;

  const total = routes.length;

  return (
    <div className="ae-catalog">
      {/* Header */}
      <div className="ae-catalog-header">
        <div className="ae-catalog-title">
          <span className="ae-catalog-icon">⟐</span>
          <span>API Catalog</span>
          <span className="ae-catalog-count">{total} live</span>
        </div>
        <input
          className="ae-catalog-search"
          type="text"
          placeholder="Filter endpoints…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category pills */}
      <div className="ae-catalog-cats">
        <button
          className={`ae-cat-pill ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({total})
        </button>
        {Object.entries(CATEGORIES).map(([name, { color, icon }]) => (
          <button
            key={name}
            className={`ae-cat-pill ${filter === name ? 'active' : ''}`}
            style={{ '--cat-color': color }}
            onClick={() => setFilter(name)}
          >
            {icon} {name} ({(grouped[name] || []).length})
          </button>
        ))}
      </div>

      {/* Endpoint cards */}
      <div className="ae-catalog-grid">
        {displayed.map(route => {
          const cat = getCat(route);
          const { color } = CATEGORIES[cat] || CATEGORIES.Data;
          const isFree = route.includes('/x402/');
          const desc = isFree
            ? `FREE — ${route.split('/').pop().replace(/[-{]/g, ' ')}`
            : SPECS[route].length + ' params';

          return (
            <div
              key={route}
              className="ae-catalog-card"
              style={{ '--card-color': color }}
              onClick={() => onSelectEndpoint?.(route)}
            >
              <div className="ae-catalog-card-top">
                <span className="ae-catalog-card-method">GET</span>
                {isFree && <span className="ae-catalog-card-free">FREE</span>}
              </div>
              <code className="ae-catalog-card-route">{route}</code>
              <div className="ae-catalog-card-meta">
                <span className="ae-catalog-card-cat" style={{ color }}>{cat}</span>
                <span>{desc}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
