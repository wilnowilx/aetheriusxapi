import { useState } from 'react';
import { apiFetch, SPECS, getApiBase } from './api';

function hlJSON(src) {
  return String(src)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/("(\\u[0-9a-fA-F]{4}|\\[^]|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?/g,
      (m, str, _e, key, bool, num) => {
        if (str) return key ? `<span class="hl-key">${str}</span>:` : `<span class="hl-str">${str}</span>`;
        if (bool) return `<span class="hl-bool">${bool}</span>`;
        if (num) return `<span class="hl-num">${num}</span>`;
        return m;
      }
    );
}

/* Explorer — select endpoint, fill params, execute against real VM */
export default function ExplorerWindow() {
  const [selected, setSelected] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [result, setResult] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  const routes = Object.keys(SPECS);

  function select(route) {
    setSelected(route);
    const vals = {};
    SPECS[route].forEach(p => { vals[p.n] = p.d || ''; });
    setFormValues(vals);
    setResult(null);
    setMeta(null);
  }

  function updateParam(name, value) {
    setFormValues(prev => ({ ...prev, [name]: value }));
  }

  async function execute(paid) {
    if (!selected) return;
    setLoading(true);
    setMeta('Executing…');

    let route = selected;
    const specs = SPECS[selected] || [];
    const pathParams = specs.filter(p => route.includes('{' + p.n + '}'));
    const queryParams = {};

    Object.entries(formValues).forEach(([k, v]) => {
      const isPath = pathParams.some(p => p.n === k);
      if (isPath && v) route = route.replace('{' + k + '}', v);
      else if (v !== '' && v != null) queryParams[k] = v;
    });

    const t0 = performance.now();
    try {
      const { data, status } = await apiFetch(route, { paid, params: queryParams });
      const ms = Math.round(performance.now() - t0);
      setMeta(`HTTP ${status} · ${ms} ms` + (paid ? ' · X-PAYMENT sent' : ''));
      setResult(data);
    } catch (e) {
      const ms = Math.round(performance.now() - t0);
      setMeta(`Network error · ${ms} ms`);
      setResult({ error: String(e) });
    }
    setLoading(false);
  }

  return (
    <div className="ae-explorer">
      <div className="ae-exp-sidebar">
        <div className="ae-exp-search">
          <input
            type="text"
            placeholder="Search endpoints…"
            onChange={(e) => {
              /* simple filter via DOM — could be state but this is fast */
              const q = e.target.value.toLowerCase();
              document.querySelectorAll('.ae-exp-ep').forEach(el => {
                el.style.display = el.dataset.route.toLowerCase().includes(q) ? '' : 'none';
              });
            }}
          />
        </div>
        <div className="ae-exp-ep-list">
          {routes.map(route => (
            <div
              key={route}
              className={`ae-exp-ep ${selected === route ? 'sel' : ''}`}
              data-route={route}
              onClick={() => select(route)}
            >
              <span className="ae-exp-method">GET</span>
              <code>{route}</code>
            </div>
          ))}
        </div>
      </div>

      <div className="ae-exp-main">
        {!selected ? (
          <div className="ae-exp-empty">
            <span className="ae-exp-empty-icon">⟐</span>
            <p>Select an endpoint from the catalog</p>
          </div>
        ) : (
          <>
            <div className="ae-exp-header">
              <code className="ae-exp-route">{selected}</code>
              <span className="ae-exp-cost">
                {selected.includes('/x402/') ? 'FREE' : '$paid'}
              </span>
            </div>

            {SPECS[selected].length > 0 && (
              <div className="ae-exp-params">
                {SPECS[selected].map(p => (
                  <label key={p.n} className="ae-exp-param">
                    <span className="ae-exp-param-name">
                      {p.n} {p.r && <span className="ae-required">*</span>}
                    </span>
                    <input
                      type={p.t === 'n' ? 'number' : 'text'}
                      step={p.t === 'n' ? 'any' : undefined}
                      value={formValues[p.n] || ''}
                      onChange={(e) => updateParam(p.n, e.target.value)}
                      placeholder={p.d || ''}
                    />
                  </label>
                ))}
              </div>
            )}

            <div className="ae-exp-actions">
              <button className="ae-btn ae-btn-free" onClick={() => execute(false)} disabled={loading}>
                ▶ Execute Free
              </button>
              <button className="ae-btn ae-btn-pay" onClick={() => execute(true)} disabled={loading}>
                ◈ Execute + Pay
              </button>
            </div>

            {meta && <div className="ae-exp-meta">{meta}</div>}

            {result != null && (
              <div className="ae-exp-result">
                <pre dangerouslySetInnerHTML={{ __html: hlJSON(JSON.stringify(result, null, 2)) }} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
