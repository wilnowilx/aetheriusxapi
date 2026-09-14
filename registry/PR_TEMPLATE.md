# MCP Registry PR — Title & Body Template

> Copy this into your PR to https://github.com/modelcontextprotocol/registry
> Fork -> branch -> copy YAMLs -> open PR. See registry/README.md for steps.

---

## PR Title

```
Add AETHERIUS Oracle and Axioms MCP servers
```

---

## PR Body — Copy from below (markdown)

### Summary

This PR adds **two AETHERIUS MCP servers** for **x402 agent commerce on Base**:

1. **`aether_oracle`** — Oracle Layer: Verified Catalog, Circuit Breaker, Credit Velocity Risk Scoring
2. **`aether_axioms`** — Research Layer: Fundamental Axioms, Ontology, Settlement Window Defense

Both servers are **GitHub-sourced** (no PyPI dependency at publish time) to bypass the transient PyPI `429 Too many new projects created` rate-limit (~1–24h window). They install directly from source via `https://github.com/wilnowilx/aetheriusxapi`.

- **Repository:** https://github.com/wilnowilx/aetheriusxapi
- **Oracle package dir:** `aether_oracle_mcp/` (`pyproject.toml` name: `aether-oracle-mcp`)
- **Axioms package dir:** `aether_axioms_mcp/` (`pyproject.toml` name: `aether-axioms-mcp`)
- **Live API (Axioms / Ontology / MCP):** `https://34.156.149.38.sslip.io/aetherapi/`
- **License:** MIT

#### Why this matters — First Settlement Window Defense

x402 enables instant USDC micropayments for M2M/A2A commerce on Base. The **first settlement window** (pre-confirmation) is the critical attack surface: double-spend, replay, credit-velocity exploitation, and unverified endpoints.

AETHERIUS is the **first defensive layer** for that window:

- **Verified Catalog** — Curated registry of trusted x402 endpoints with price/category/settlement metadata; agents `discover` before they pay.
- **Circuit Breaker + Anti-Replay** — Global nonce graph + adaptive velocity throttling (`status` tool) that trips before settlement finality.
- **Credit Velocity Risk Scoring** — `risk`/`reputation` tools score wallet `address` by spending velocity, counterparty graph, and historical settlement behavior — enabling agents to refuse risky counterparties *before* signing EIP-3009.
- **Axioms & Ontology** — Formal research layer (`get_axioms`, `query_axiom`, `validate_axiom_application`, `get_ontology`) encoding settlement-window invariants so agents and auditors can reason about — and prove — defense properties.

This is **agent commerce infrastructure**, not a demo wrapper.

---

### Servers Added

#### 1) aether_oracle — `registry/aether_oracle.yaml`

```yaml
name: "aether_oracle"
version: "1.0.0"
description: "AETHERIUS Oracle Layer — Verified Catalog, Circuit Breaker, Credit Velocity Risk Scoring for x402 agent commerce on Base"
repository: "https://github.com/wilnowilx/aetheriusxapi/tree/main/aether_oracle_mcp"
pypi: "aether-oracle-mcp"
```

| Field | Value |
|-------|-------|
| **Tools (5)** | `discover` — verified catalog · `status` — circuit breaker/anti-replay/health · `call` — paid x402 call · `reputation` — endpoint reputation · `risk` — Credit Velocity per address |
| **Resources (3)** | `oracle://verified-catalog` · `oracle://system-status` · `oracle://risk/{address}` |
| **Transports** | `stdio`, `sse`, `http` |
| **Tags** | `x402`, `oracle`, `credit-velocity`, `agent-commerce`, `base`, `usdc`, `settlement-window` |

#### 2) aether_axioms — `registry/aether_axioms.yaml`

```yaml
name: "aether_axioms"
version: "1.0.0"
description: "AETHERIUS Research Layer — Fundamental Axioms, Ontology, Settlement Window Defense for M2M commerce on Base"
repository: "https://github.com/wilnowilx/aetheriusxapi/tree/main/aether_axioms_mcp"
pypi: "aether-axioms-mcp"
```

| Field | Value |
|-------|-------|
| **Tools (5)** | `get_axioms` — all axioms · `get_axiom` — by ID · `get_ontology` — classes/properties/individuals · `query_axiom` — by domain/keyword/applicable_to · `validate_axiom_application` — which axioms apply to a system description |
| **Resources (3)** | `axioms://axioms` · `axioms://ontology` · `axioms://axiom/{id}` |
| **Transports** | `stdio`, `sse`, `http` |
| **Tags** | `x402`, `axioms`, `ontology`, `settlement-window`, `research`, `credit-velocity`, `m2m` |

---

### Installation — GitHub Source (PyPI 429 bypass)

> **Context:** PyPI currently returns `429 Too many new projects created` for new project names (`aether-oracle-mcp`, `aether-axioms-mcp`). This is a transient anti-abuse rate-limit (~1–24h). These entries use **GitHub source** so review and merge are not blocked.

**Option A — uv / pip from GitHub (recommended until PyPI publishes):**

```bash
# Oracle
pip install git+https://github.com/wilnowilx/aetheriusxapi.git#subdirectory=aether_oracle_mcp
# or
uv pip install git+https://github.com/wilnowilx/aetheriusxapi.git#subdirectory=aether_oracle_mcp

# Axioms
pip install git+https://github.com/wilnowilx/aetheriusxapi.git#subdirectory=aether_axioms_mcp
```

**Option B — Local clone:**

```bash
git clone https://github.com/wilnowilx/aetheriusxapi && cd aetheriusxapi
pip install -e ./aether_oracle_mcp
pip install -e ./aether_axioms_mcp
```

**Option C — After PyPI recovers (no action needed by registry):**

```bash
pip install aether-oracle-mcp aether-axioms-mcp
```

`pyproject.toml` already declares both packages (`mcp>=1.0.0`, `httpx`, `pydantic`, `rdflib` for axioms, `uvicorn`, `sse-starlette`, `starlette`) and entry points `aether_oracle_mcp` / `aether_axioms_mcp`.

---

### Live Endpoints (no auth required for read)

All are served from the production AETHERIUS API behind `sslip.io`:

- **Axioms JSON:** https://34.156.149.38.sslip.io/aetherapi/v1/axioms
- **Ontology (Turtle/JSON-LD):** https://34.156.149.38.sslip.io/aetherapi/v1/ontology
- **MCP over SSE:** https://34.156.149.38.sslip.io/mcp/sse
- **Docs / Homepage:** https://wilnowilx.github.io/aetheriusxapi
- **Base explorer / x402:** see `main.py` + `x402_middleware.py` in repo

> If the ephemeral IP rotates, the canonical hostname remains `https://wilnowilx.github.io/aetheriusxapi` with fresh endpoint in README.

---

### Test Instructions (for reviewers)

#### 1) Validate YAML

```bash
python -c "import yaml; print(yaml.safe_load(open('registry/aether_oracle.yaml')))"
python -c "import yaml; print(yaml.safe_load(open('registry/aether_axioms.yaml')))"
```

#### 2) Smoke-test Axioms server (stdio)

```bash
pip install -e ./aether_axioms_mcp
python -m aether_axioms_mcp.server --transport stdio
# then MCP client: tools/list -> get_axioms, get_axiom, get_ontology, query_axiom, validate_axiom_application
```

Quick non-MCP sanity check of live API:

```bash
curl -s https://34.156.149.38.sslip.io/aetherapi/v1/axioms | head -c 800
curl -s https://34.156.149.38.sslip.io/aetherapi/v1/ontology | head -c 800
```

#### 3) Smoke-test Oracle server (stdio)

```bash
pip install -e ./aether_oracle_mcp
python -m aether_oracle_mcp.server --transport stdio
# tools/list -> discover, status, call, reputation, risk
```

Oracle also supports `sse`/`http`:

```bash
python -m aether_axioms_mcp.server --transport sse --port 8080
# -> http://localhost:8080/mcp/sse
```

#### 4) Expected results

- `discover` returns verified catalog with `route`, `price`, `category`, `settlement`.
- `status` returns `{ circuit_breaker, anti_replay, health }`.
- `risk {address: "0x..."}` returns velocity score + counterparties.
- `get_axioms` returns collection `AxiomCollection` with axioms array.
- `get_axiom {axiom_id: "axiom-001"}` returns single axiom.
- `get_ontology` returns `{classes, properties, individuals}` from `research/ontology.ttl`.
- `query_axiom {keyword: "settlement"}` filters correctly.
- `validate_axiom_application {system_description: "x402 payment with rate limit defense"}` returns applicable axioms with relevance.

---

### Checklist

- [x] Two YAML entries in `registry/` — valid YAML, correct names/versions
- [x] GitHub source is installable now; PyPI name reserved (`aether-oracle-mcp`, `aether-axioms-mcp`) for post-429 publish
- [x] MIT license, homepage, tags, transports declared
- [x] Live endpoints reachable and CORS-enabled for MCP clients
- [x] Servers implement `tools/list` + `tools/call` over `stdio`/`sse`/`http`
- [x] No secrets in repo; `x402_middleware.py` uses env vars for settlement

---

### Notes for Maintainers

- PyPI `429` is transient; we will publish `aether-oracle-mcp` and `aether-axioms-mcp` to PyPI within 24h and update `pypi` field if needed — **no registry change required** since `repository` (GitHub source) remains canonical.
- If you prefer we split into two PRs, happy to — bundled here because they share repo, license, and defense narrative.
- Contact: `research@aetherius.dev` / GitHub issues at `wilnowilx/aetheriusxapi`.

---

### Related

- MCP Registry: https://github.com/modelcontextprotocol/registry
- AETHERIUS Docs: https://wilnowilx.github.io/aetheriusxapi
- x402 spec: https://www.x402.org
- Base: https://base.org
