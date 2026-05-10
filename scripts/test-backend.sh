#!/bin/bash
set -e

BACKEND_DIR="$(dirname "$0")/../backend"

echo "Running backend tests..."
cd "$BACKEND_DIR"
PYTHONPATH=./src "$BACKEND_DIR/src/venv/bin/pytest" ../tests/backend/ -v --tb=short
