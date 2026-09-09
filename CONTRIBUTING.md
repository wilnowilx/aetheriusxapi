# Contributing to aetheriusxAPI

Thank you for your interest in contributing to aetheriusxAPI! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Submit a pull request

## Development Setup

### Prerequisites

- Python 3.10+
- pip or poetry
- Git

### Installation

```bash
git clone https://github.com/wilnowilx/aetheriusxapi.git
cd aetheriusxapi
pip install -r requirements.txt
```

> Every PR answers the template checklist: tests green, docs updated
> (`docs/API.md` for routes, `wiki/` for behavior/ops), `CHANGELOG.md` entry,
> no secrets, Base-first narrative. See `.github/PULL_REQUEST_TEMPLATE.md`.

### Running Locally

```bash
uvicorn main:app --reload --port 4020
```

## Code Style

- Follow PEP 8 for Python code
- Use type hints
- Write docstrings for all functions
- Keep functions focused and small

## Testing

```bash
pytest tests/
```

All contributions must include tests.

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Request review from maintainers

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

## Questions?

Open an issue or reach out on Twitter [@aetheriusxAPI](https://x.com/aetheriusxAPI).
