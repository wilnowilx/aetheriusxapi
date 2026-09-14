# AETHERIUS — MCP Registry Submission Guide

> **Bypass PyPI 429 via GitHub source.** PyPI is returning `429 Too many new projects created` for `aether-oracle-mcp` / `aether-axioms-mcp` (~1–24h window). The MCP Registry accepts GitHub-sourced servers, so we submit now and publish to PyPI when the window clears — no re-review needed.

Registry upstream: **https://github.com/modelcontextprotocol/registry**

This folder contains two ready-to-submit entries:

| File | Server | Tools | Resources |
|------|--------|-------|-----------|
| `aether_oracle.yaml` | `aether_oracle` v1.0.0 — Oracle Layer | `discover`, `status`, `call`, `reputation`, `risk` | `oracle://verified-catalog`, `oracle://system-status`, `oracle://risk/{address}` |
| `aether_axioms.yaml` | `aether_axioms` v1.0.0 — Research Layer | `get_axioms`, `get_axiom`, `get_ontology`, `query_axiom`, `validate_axiom_application` | `axioms://axioms`, `axioms://ontology`, `axioms://axiom/{id}` |

Live API: `https://34.156.149.38.sslip.io/aetherapi/v1/axioms`, `/v1/ontology`, `/mcp/sse` · Repo: `https://github.com/wilnowilx/aetheriusxapi`

---

## 1. What the Registry Expects

The MCP Registry ingests community servers either as:

- **PyPI package** (`pypi: <name>`), or
- **GitHub source** (`repository: https://github.com/...` with `pyproject.toml`)

Since PyPI is 429-blocked, we declare **both** — `repository` is authoritative; `pypi` is reserved name for later publish. Reviewers install via:

```bash
pip install git+https://github.com/wilnowilx/aetheriusxapi.git#subdirectory=aether_oracle_mcp
pip install git+https://github.com/wilnowilx/aetheriusxapi.git#subdirectory=aether_axioms_mcp
```

Each `pyproject.toml` already has:

- `mcp` metadata (`[mcp] name, version, description, tools, resources, transport`)
- `project.scripts` entry points (`aether_oracle_mcp`, `aether_axioms_mcp`)
- Dependencies (`mcp>=1.0.0`, `httpx`, `pydantic`, `rdflib` for axioms, `uvicorn`, `sse-starlette`, `starlette`)

---

## 2. Validate Locally (required before PR)

```bash
# from repo root: C:\Users\wil\Documents\pagina web\aetheriusxapi
python -c "import yaml, json; print(json.dumps(yaml.safe_load(open('registry/aether_oracle.yaml')), indent=2))"
python -c "import yaml, json; print(json.dumps(yaml.safe_load(open('registry/aether_axioms.yaml')), indent=2))"

# or strict:
python -c "import yaml; yaml.safe_load(open('registry/aether_oracle.yaml')); yaml.safe_load(open('registry/aether_axioms.yaml')); print('YAML OK')"

# optional schema lint (if registry provides JSON schema):
# npx @modelcontextprotocol/registry validate registry/aether_oracle.yaml registry/aether_axioms.yaml
```

Smoke-test the servers themselves:

```bash
pip install -e ./aether_oracle_mcp -e ./aether_axioms_mcp

# stdio (used by Claude Desktop / MCP clients)
python -m aether_oracle_mcp.server --transport stdio
python -m aether_axioms_mcp.server --transport stdio

# sse/http
python -m aether_axioms_mcp.server --transport sse --port 8080
curl -s http://localhost:8080/mcp/sse -H "Accept: text/event-stream"

# live API (no auth)
curl -s https://34.156.149.38.sslip.io/aetherapi/v1/axioms | head -c 1200
curl -s https://34.156.149.38.sslip.io/aetherapi/v1/ontology | head -c 1200
```

---

## 3. Submit to MCP Registry — Step by Step

### 3.1 Fork & Clone

```bash
# on GitHub: fork https://github.com/modelcontextprotocol/registry -> wilnowilx/registry
git clone https://github.com/wilnowilx/registry.git
cd registry
git remote add upstream https://github.com/modelcontextprotocol/registry.git
git fetch upstream
git checkout -b add-aetherius-oracle-axioms
```

### 3.2 Copy Entries

The registry repo structure may vary (check upstream `README.md` / `CONTRIBUTING.md`). Common patterns:

- **Option A — `servers/` or `registry/` folder with one YAML/JSON per server:**
  ```bash
  cp /path/to/aetheriusxapi/registry/aether_oracle.yaml ./servers/aether_oracle.yaml
  cp /path/to/aetheriusxapi/registry/aether_axioms.yaml ./servers/aether_axioms.yaml
  # or ./registry/, ./data/, ./src/data/ — match whatever upstream uses
  ```

- **Option B — Single catalog file (`servers.json`, `registry.json`):**
  Append both entries to that file following existing schema. Keep `aether_oracle` and `aether_axioms` as separate objects.

> **How to know which:** `ls` the fork root after cloning. If you see `servers/`, `registry/`, or `data/` with many YAML/JSON files, use Option A. If you see a single `registry.json`, use Option B. When in doubt, open an issue or follow `CONTRIBUTING.md`.

Our local files are at:

```
C:\Users\wil\Documents\pagina web\aetheriusxapi\registry\aether_oracle.yaml
C:\Users\wil\Documents\pagina web\aetheriusxapi\registry\aether_axioms.yaml
```

### 3.3 Commit & Push

```bash
git add servers/aether_oracle.yaml servers/aether_axioms.yaml
git commit -m "Add AETHERIUS Oracle and Axioms MCP servers (GitHub source, PyPI 429 bypass)"
git push origin add-aetherius-oracle-axioms
```

### 3.4 Open PR

- **Title:** `Add AETHERIUS Oracle and Axioms MCP servers`
- **Body:** Copy-paste from `registry/PR_TEMPLATE.md` (the section after `## PR Body`)
- **Base:** `modelcontextprotocol/registry:main`
- **Labels (if available):** `new-server`, `x402`, `community`

In the PR description, call out:

- GitHub source bypass for PyPI 429 (transient 1–24h)
- Live endpoints: `34.156.149.38.sslip.io/aetherapi/v1/axioms`, `/v1/ontology`, `/mcp/sse`
- Test instructions (see template)
- First settlement window defense narrative

### 3.5 After PyPI Recovers

```bash
# from aetheriusxapi repo
cd aether_oracle_mcp && python -m build && twine upload dist/*
cd ../aether_axioms_mcp && python -m build && twine upload dist/*
# retry if 429 persists: wait 1h, then `twine upload` again
```

No registry PR update needed — `repository` remains canonical. Optionally comment on the merged PR with PyPI links.

---

## 4. File Reference

```
registry/
├── aether_oracle.yaml   # Oracle Layer — 5 tools, 3 resources, stdio/sse/http, MIT
├── aether_axioms.yaml   # Research Layer — 5 tools, 3 resources, stdio/sse/http, MIT
├── PR_TEMPLATE.md       # Title + full body to paste into registry PR
└── README.md            # This file
```

### aether_oracle.yaml (excerpt)

```yaml
name: "aether_oracle"
version: "1.0.0"
description: "AETHERIUS Oracle Layer — Verified Catalog, Circuit Breaker, Credit Velocity Risk Scoring for x402 agent commerce on Base"
repository: "https://github.com/wilnowilx/aetheriusxapi/tree/main/aether_oracle_mcp"
pypi: "aether-oracle-mcp"
license: "MIT"
homepage: "https://wilnowilx.github.io/aetheriusxapi"
tags: ["x402", "oracle", "credit-velocity", "agent-commerce", "base", "usdc", "settlement-window"]
transport: ["stdio", "sse", "http"]
tools:
  - name: "discover"
    description: "Discover verified x402 endpoints from the Oracle catalog"
  - name: "status"
    description: "Get Oracle system status — circuit breaker, anti-replay, health"
  - name: "call"
    description: "Make a paid x402 API call through the Oracle"
  - name: "reputation"
    description: "Get endpoint reputation score"
  - name: "risk"
    description: "Get agent risk score via Credit Velocity"
resources:
  - "oracle://verified-catalog"
  - "oracle://system-status"
  - "oracle://risk/{address}"
```

### aether_axioms.yaml (excerpt)

```yaml
name: "aether_axioms"
version: "1.0.0"
description: "AETHERIUS Research Layer — Fundamental Axioms, Ontology, Settlement Window Defense for M2M commerce on Base"
repository: "https://github.com/wilnowilx/aetheriusxapi/tree/main/aether_axioms_mcp"
pypi: "aether-axioms-mcp"
license: "MIT"
homepage: "https://wilnowilx.github.io/aetheriusxapi"
tags: ["x402", "axioms", "ontology", "settlement-window", "research", "credit-velocity", "m2m"]
transport: ["stdio", "sse", "http"]
tools:
  - name: "get_axioms"
  - name: "get_axiom"
  - name: "get_ontology"
  - name: "query_axiom"
  - name: "validate_axiom_application"
resources:
  - "axioms://axioms"
  - "axioms://ontology"
  - "axioms://axiom/{id}"
```

---

## 5. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `PyPI 429 Too many new projects` on `twine upload` | Wait 1–24h, retry. Registry PR is **not blocked** — GitHub source is valid. |
| `pip install git+https://...#subdirectory=...` fails | Ensure `aether_oracle_mcp/pyproject.toml` and `aether_axioms_mcp/pyproject.toml` have `[build-system]` + `setuptools`. Use `pip install -e ./aether_oracle_mcp` locally. |
| Registry CI says “missing pypi” | Explain in PR body that `pypi` name is reserved, package is GitHub-installable; link to this README. |
| Live endpoint `sslip.io` unreachable | Check `https://wilnowilx.github.io/aetheriusxapi` for new IP, or run locally: `uvicorn main:app --port 8000`. |
| `rdflib` missing for axioms | `pip install rdflib>=7.0.0` — declared in `aether_axioms_mcp/pyproject.toml`. |

---

## 6. Next Steps Checklist

- [ ] Validate YAML: `python -c "import yaml; yaml.safe_load(open('registry/aether_oracle.yaml'))"`
- [ ] Fork `modelcontextprotocol/registry`
- [ ] Branch `add-aetherius-oracle-axioms`
- [ ] Copy both YAMLs into upstream’s expected folder
- [ ] Commit, push, open PR with title/body from `PR_TEMPLATE.md`
- [ ] Respond to reviewer comments (usually schema/tags nits)
- [ ] After merge: retry PyPI publish when 429 clears

Questions: `research@aetherius.dev` or open an issue at `wilnowilx/aetheriusxapi`.
