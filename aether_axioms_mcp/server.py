#!/usr/bin/env python3
"""
AETHERIUS Axioms MCP Server

Exposes AETHERIUS fundamental axioms and ontology via Model Context Protocol.
Supports stdio transport.
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from mcp.server import Server
from mcp import types
from mcp.server.stdio import stdio_server
from pydantic import BaseModel, Field
from rdflib import Graph, URIRef, RDFS, OWL, RDF

# ─── Constants ──────────────────────────────────────────────────────────────
RESEARCH_DIR = Path(__file__).parent.parent / "research"
AXIOMS_FILE = RESEARCH_DIR / "axioms.json"
ONTOLOGY_FILE = RESEARCH_DIR / "ontology.ttl"

AXIOM_NS = "https://aetherius.dev/ontology#"

# ─── Models ─────────────────────────────────────────────────────────────────
class AxiomVariable(BaseModel):
    name: str
    type: str
    unit: str


class AxiomFormula(BaseModel):
    symbolic: str
    variables: Dict[str, AxiomVariable]


class Axiom(BaseModel):
    id: str
    name: str
    statement_es: str
    statement_en: str
    formula: AxiomFormula
    domain: str
    applicable_to: List[str]
    proven: bool
    proof_reference: str
    evidence: List[str]
    implications: List[str]


class AxiomCollection(BaseModel):
    id: str
    name: str
    version: str
    created: str
    author: str
    description: str
    axioms: List[Axiom]


# ─── Data Loading ───────────────────────────────────────────────────────────
def load_axioms() -> AxiomCollection:
    """Load axioms from JSON file."""
    with open(AXIOMS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return AxiomCollection(**data)


def load_ontology() -> Graph:
    """Load RDF ontology from TTL file."""
    g = Graph()
    g.parse(str(ONTOLOGY_FILE), format="turtle")
    return g


# Global data (loaded at startup)
AXIOM_COLLECTION = load_axioms()
ONTOLOGY_GRAPH = load_ontology()

# ─── Helper Functions ───────────────────────────────────────────────────────
def axiom_to_resource_uri(axiom_id: str) -> str:
    """Generate resource URI for an axiom."""
    return f"{AXIOM_NS}{axiom_id}"


def format_ontology_response() -> Dict[str, Any]:
    """Extract classes, properties, individuals from ontology graph."""
    classes = []
    properties = []
    individuals = []

    for s, p, o in ONTOLOGY_GRAPH:
        s_str = str(s)
        o_str = str(o)

        if p == RDFS.subClassOf and o == OWL.Class:
            continue
        if p == RDFS.subPropertyOf:
            continue

        if str(p) == str(RDFS.label) and isinstance(o, URIRef):
            continue

        # Classes
        if p == RDF.type and o == OWL.Class:
            label = str(ONTOLOGY_GRAPH.value(s, RDFS.label, default=""))
            comment = str(ONTOLOGY_GRAPH.value(s, RDFS.comment, default=""))
            classes.append({"uri": s_str, "label": label, "comment": comment})

        # Object Properties
        elif p == RDF.type and o == OWL.ObjectProperty:
            label = str(ONTOLOGY_GRAPH.value(s, RDFS.label, default=""))
            comment = str(ONTOLOGY_GRAPH.value(s, RDFS.comment, default=""))
            domain = str(ONTOLOGY_GRAPH.value(s, RDFS.domain, default=""))
            range_ = str(ONTOLOGY_GRAPH.value(s, RDFS.range, default=""))
            properties.append(
                {
                    "uri": s_str,
                    "type": "ObjectProperty",
                    "label": label,
                    "comment": comment,
                    "domain": domain,
                    "range": range_,
                }
            )

        # Datatype Properties
        elif p == RDF.type and o == OWL.DatatypeProperty:
            label = str(ONTOLOGY_GRAPH.value(s, RDFS.label, default=""))
            comment = str(ONTOLOGY_GRAPH.value(s, RDFS.comment, default=""))
            domain = str(ONTOLOGY_GRAPH.value(s, RDFS.domain, default=""))
            range_ = str(ONTOLOGY_GRAPH.value(s, RDFS.range, default=""))
            properties.append(
                {
                    "uri": s_str,
                    "type": "DatatypeProperty",
                    "label": label,
                    "comment": comment,
                    "domain": domain,
                    "range": range_,
                }
            )

        # Individuals
        elif isinstance(s, URIRef) and AXIOM_NS in s_str:
            if not any(
                (s, RDF.type, cls) in ONTOLOGY_GRAPH
                for cls in [OWL.Class, OWL.ObjectProperty, OWL.DatatypeProperty]
            ):
                types_ = [str(t) for t in ONTOLOGY_GRAPH.objects(s, RDF.type)]
                label = str(ONTOLOGY_GRAPH.value(s, RDFS.label, default=""))
                individuals.append({"uri": s_str, "types": types_, "label": label})

    return {
        "classes": classes,
        "properties": properties,
        "individuals": individuals,
    }


def query_axioms(
    domain: Optional[str] = None,
    keyword: Optional[str] = None,
    applicable_to: Optional[str] = None,
) -> List[Axiom]:
    """Query axioms by criteria."""
    results = AXIOM_COLLECTION.axioms

    if domain:
        results = [a for a in results if domain.lower() in a.domain.lower()]

    if keyword:
        kw = keyword.lower()
        results = [
            a
            for a in results
            if kw in a.name.lower()
            or kw in a.statement_en.lower()
            or kw in a.statement_es.lower()
        ]

    if applicable_to:
        at = applicable_to.lower()
        results = [a for a in results if any(at in app.lower() for app in a.applicable_to)]

    return results


def validate_axiom_application(
    system_description: str, context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Check which axioms apply to a system description."""
    desc_lower = system_description.lower()
    applicable = []

    for axiom in AXIOM_COLLECTION.axioms:
        # Check if domain matches
        domain_match = any(
            term in desc_lower
            for term in [
                "payment",
                "settlement",
                "x402",
                "m2m",
                "commerce",
                "velocity",
                "rate limit",
                "defense",
                "fraud",
                "attack",
                "exploitation",
            ]
        )

        # Check applicable_to terms
        app_match = any(term.lower() in desc_lower for term in axiom.applicable_to)

        if domain_match or app_match:
            applicable.append(
                {
                    "axiom_id": axiom.id,
                    "name": axiom.name,
                    "statement": axiom.statement_en,
                    "formula": axiom.formula.symbolic,
                    "domain": axiom.domain,
                    "relevance": "high" if app_match else "medium",
                }
            )

    return {
        "system_description": system_description,
        "applicable_axioms": applicable,
        "total_found": len(applicable),
        "context": context or {},
    }


# ─── Tool Definitions ───────────────────────────────────────────────────────
TOOLS = [
    types.Tool(
        name="get_axioms",
        description="Returns all AETHERIUS fundamental axioms",
        inputSchema={
            "type": "object",
            "properties": {},
        },
    ),
    types.Tool(
        name="get_axiom",
        description="Returns a specific axiom by ID",
        inputSchema={
            "type": "object",
            "properties": {
                "axiom_id": {"type": "string", "description": "Axiom ID (e.g., axiom-001)"}
            },
            "required": ["axiom_id"],
        },
    ),
    types.Tool(
        name="get_ontology",
        description="Returns the AETHERIUS ontology (classes, properties, individuals)",
        inputSchema={"type": "object", "properties": {}},
    ),
    types.Tool(
        name="query_axiom",
        description="Query axioms by domain or keyword",
        inputSchema={
            "type": "object",
            "properties": {
                "domain": {"type": "string", "description": "Filter by domain"},
                "keyword": {"type": "string", "description": "Search keyword"},
                "applicable_to": {
                    "type": "string",
                    "description": "Filter by applicable system",
                },
            },
        },
    ),
    types.Tool(
        name="validate_axiom_application",
        description="Given a system description, check if axioms apply",
        inputSchema={
            "type": "object",
            "properties": {
                "system_description": {
                    "type": "string",
                    "description": "Description of the system to validate",
                },
                "context": {
                    "type": "object",
                    "description": "Additional context for validation",
                },
            },
            "required": ["system_description"],
        },
    ),
]


# ─── Request Handlers ───────────────────────────────────────────────────────
async def handle_list_tools(
    _ctx: Any, request: types.ListToolsRequest
) -> types.ListToolsResult:
    return types.ListToolsResult(tools=TOOLS)


async def handle_call_tool(
    _ctx: Any, request: types.CallToolRequest
) -> types.CallToolResult:
    name = request.params.name
    arguments = request.params.arguments or {}

    if name == "get_axioms":
        return types.CallToolResult(
            content=[
                types.TextContent(
                    type="text",
                    text=json.dumps(
                        {
                            "collection": AXIOM_COLLECTION.model_dump(),
                            "resources": {
                                axiom.id: axiom_to_resource_uri(axiom.id)
                                for axiom in AXIOM_COLLECTION.axioms
                            },
                        },
                        indent=2,
                        ensure_ascii=False,
                    ),
                )
            ]
        )

    elif name == "get_axiom":
        axiom_id = arguments.get("axiom_id")
        axiom = next((a for a in AXIOM_COLLECTION.axioms if a.id == axiom_id), None)
        if not axiom:
            return types.CallToolResult(
                content=[
                    types.TextContent(
                        type="text",
                        text=json.dumps(
                            {"error": f"Axiom not found: {axiom_id}"}, indent=2
                        ),
                    )
                ]
            )
        return types.CallToolResult(
            content=[
                types.TextContent(
                    type="text",
                    text=json.dumps(
                        {
                            "axiom": axiom.model_dump(),
                            "resource_uri": axiom_to_resource_uri(axiom_id),
                        },
                        indent=2,
                        ensure_ascii=False,
                    ),
                )
            ]
        )

    elif name == "get_ontology":
        return types.CallToolResult(
            content=[
                types.TextContent(
                    type="text",
                    text=json.dumps(
                        {
                            "ontology": format_ontology_response(),
                            "base_uri": AXIOM_NS,
                            "file": str(ONTOLOGY_FILE),
                        },
                        indent=2,
                        ensure_ascii=False,
                    ),
                )
            ]
        )

    elif name == "query_axiom":
        results = query_axioms(
            domain=arguments.get("domain"),
            keyword=arguments.get("keyword"),
            applicable_to=arguments.get("applicable_to"),
        )
        return types.CallToolResult(
            content=[
                types.TextContent(
                    type="text",
                    text=json.dumps(
                        {
                            "results": [a.model_dump() for a in results],
                            "count": len(results),
                            "query": arguments,
                        },
                        indent=2,
                        ensure_ascii=False,
                    ),
                )
            ]
        )

    elif name == "validate_axiom_application":
        result = validate_axiom_application(
            system_description=arguments.get("system_description", ""),
            context=arguments.get("context"),
        )
        return types.CallToolResult(
            content=[
                types.TextContent(
                    type="text",
                    text=json.dumps(result, indent=2, ensure_ascii=False),
                )
            ]
        )

    else:
        return types.CallToolResult(
            content=[
                types.TextContent(
                    type="text",
                    text=json.dumps({"error": f"Unknown tool: {name}"}, indent=2),
                )
            ]
        )


# ─── MCP Server Setup ───────────────────────────────────────────────────────
server = Server("aetherius-axioms")

server.add_request_handler("tools/list", types.ListToolsRequest, handle_list_tools)
server.add_request_handler("tools/call", types.CallToolRequest, handle_call_tool)


# ─── Entry Point ────────────────────────────────────────────────────────────
async def main():
    """Run MCP server over stdio."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())