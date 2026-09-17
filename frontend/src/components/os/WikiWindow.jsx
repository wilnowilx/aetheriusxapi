import { useState } from 'react';

const DOCS_BASE = 'https://github.com/wilnowilx/aetheriusxapi/blob/main/docs';

/* Distilled from the real tutorials in docs/tutorials — compressed, honest,
   always linking to the full document. */
const ARTICLES = [
  {
    id: 'first-call',
    en: { title: 'Your first x402 call', body: 'Ask an endpoint without payment and it answers 402 Payment Required with machine-readable price, asset, network and recipient. Add the payment proof and retry: 200 with data. Observed, not promised — see the tutorial for exact transcripts.', link: 'tutorials/01-first-x402-call.md' },
    es: { title: 'Tu primera llamada x402', body: 'Pide un endpoint sin pagar y responde 402 Payment Required con precio, activo, red y destinatario legibles por máquina. Agrega la prueba de pago y reintenta: 200 con datos. Observado, no prometido — ver transcripciones exactas en el tutorial.', link: 'tutorials/01-primera-llamada-x402.md' },
  },
  {
    id: 'agent-pays',
    en: { title: 'An agent pays', body: 'A minimal agent discovers the catalog, picks the cheapest paid route, takes the 402 challenge and retries with payment. Local mode accepts any X-PAYMENT for practice; mainnet requires real USDC signing.', link: 'tutorials/03-agent-first-paid-call.md' },
    es: { title: 'Un agente paga', body: 'Un agente mínimo descubre el catálogo, elige la ruta pagada más barata, acepta el desafío 402 y reintenta con el pago. El modo local acepta cualquier X-PAYMENT para practicar; mainnet exige firma USDC real.', link: 'tutorials/03-llamada-pagada-agente.md' },
  },
  {
    id: 'settlement',
    en: { title: 'Settlement first', body: 'Data is served after payment settles — never against a mere proof. Velocity over ~10 req/s or settlement rate near zero trips the risk validator (429 blocked). Defense reacts in under 2 seconds.', link: 'API.md' },
    es: { title: 'Settlement primero', body: 'Los datos se sirven cuando el pago se asienta —nunca contra una simple prueba. Velocidad sobre ~10 req/s o tasa de settlement cercana a cero activan el validador de riesgo (429 bloqueado). La defensa reacciona en menos de 2 segundos.', link: 'API.md' },
  },
  {
    id: 'oracle',
    en: { title: 'Oracle & catalog', body: 'The verified catalog lists every live endpoint with health checks; the circuit breaker publishes system state; the risk endpoint scores any wallet. Agents discover here before spending a cent.', link: 'API.md' },
    es: { title: 'Oráculo y catálogo', body: 'El catálogo verificado lista cada endpoint vivo con health checks; el circuit breaker publica el estado del sistema; el endpoint de riesgo puntúa cualquier wallet. Los agentes descubren aquí antes de gastar un centavo.', link: 'API.md' },
  },
];

export default function WikiWindow() {
  const [lang, setLang] = useState('en');
  const [open, setOpen] = useState('first-call');
  const art = ARTICLES.find(a => a.id === open);
  const t = art[lang];
  return (
    <div className="ae-metrics">
      <div className="ae-metrics-status">
        <span className="ae-dot-on" /> Wiki · EN/ES
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {['en', 'es'].map(l => (
            <button key={l} onClick={() => setLang(l)}
              style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
                background: lang === l ? 'rgba(168,85,247,.25)' : 'transparent',
                color: lang === l ? '#fff' : '#8a8a9a', border: '1px solid rgba(168,85,247,.3)' }}>
              {l.toUpperCase()}
            </button>
          ))}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 8, marginTop: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ARTICLES.map(a => (
            <button key={a.id} onClick={() => setOpen(a.id)}
              style={{ textAlign: 'left', fontSize: 11, padding: '8px', borderRadius: 6, cursor: 'pointer',
                background: open === a.id ? 'rgba(168,85,247,.15)' : 'rgba(255,255,255,.02)',
                color: open === a.id ? '#fff' : '#a5a5b5', border: '1px solid rgba(255,255,255,.05)' }}>
              {a[lang].title}
            </button>
          ))}
        </div>
        <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{t.title}</div>
          <p style={{ fontSize: 12, lineHeight: 1.6, color: '#c5c5d5' }}>{t.body}</p>
          <a href={`${DOCS_BASE}/${t.link}`} target="_blank" rel="noreferrer"
            style={{ fontSize: 11, color: '#a855f7' }}>Full doc → {t.link}</a>
        </div>
      </div>
    </div>
  );
}
