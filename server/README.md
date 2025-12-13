# Server Development

## Getting Started

This project uses [uv](https://github.com/astral-sh/uv) for fast Python package management and virtual environment handling.

### Why uv?

uv is **extremely fast** - it's written in Rust and can be 10-100x faster than traditional tools like pip. It handles dependency resolution, virtual environments, and package installation all in one tool.

### Setup

1. Install uv (if you haven't already):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. Install dependencies:
   ```bash
   uv sync
   ```

3. Run the server:
   ```bash
   uv run python main.py
   ```

## Adding Dependencies

To add a new dependency:

```bash
uv add <package-name>
```

For example:
```bash
uv add fastapi
uv add requests
```

For development dependencies:
```bash
uv add --dev pytest
```

## Running Commands

Run any Python command within the uv environment:

```bash
uv run python main.py
uv run pytest
```

## Virtual Environment

uv automatically manages a virtual environment. To activate it manually:

```bash
source .venv/bin/activate  # On macOS/Linux
```

Or use `uv run` which automatically uses the correct environment.
