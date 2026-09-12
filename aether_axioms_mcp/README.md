# AETHERIUS Axioms MCP Server

Model Context Protocol server exposing AETHERIUS fundamental axioms and ontology.

## Tools

1. **get_axioms** - Returns all AETHERIUS fundamental axioms with resource URIs
2. **get_axiom** - Returns a specific axiom by ID (e.g., `axiom-001`)
3. **get_ontology** - Returns the AETHERIUS ontology (classes, properties, individuals)
4. **query_axiom** - Query axioms by domain, keyword, or applicable system
5. **validate_axiom_application** - Given a system description, check which axioms apply

## Data Sources

- `../research/axioms.json` - Axiom definitions with formulas and evidence
- `../research/ontology.ttl` - RDF/OWL ontology in Turtle format

## Usage

```bash
# Run with stdio transport
python -m aether_axioms_mcp

# Or directly
python server.py
```

## MCP Configuration

Add to your MCP client config:

```json
{
  "mcpServers": {
    "aetherius-axioms": {
      "command": "python",
      "args": ["-m", "aether_axioms_mcp"],
      "cwd": "/path/to/aetheriusxapi/aether_axioms_mcp"
    }
  }
}
```

## Example Queries

```json
// Get all axioms
{"name": "get_axioms", "arguments": {}}

// Get specific axiom
{"name": "get_axiom", "arguments": {"axiom_id": "axiom-001"}}

// Query by domain
{"name": "query_axiom", "arguments": {"domain": "M2M Security"}}

// Query by keyword
{"name": "query_axiom", "arguments": {"keyword": "settlement"}}

// Query by applicable system
{"name": "query_axiom", "arguments": {"applicable_to": "x402"}}

// Validate system
{"name": "validate_axiom_application", "arguments": {
  "system_description": "x402 payment system with velocity detection and fraud prevention"
}}
```