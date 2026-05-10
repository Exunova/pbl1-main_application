#!/bin/bash
set -e

BACKEND_DIR="$(dirname "$0")/../backend"
VENV_DIR="$BACKEND_DIR/src/venv"

# Create venv if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating Python virtual environment..."
    python -m venv "$VENV_DIR"
fi

# Install dependencies
echo "Installing Python dependencies..."
python -m pip install -r "$BACKEND_DIR/src/requirements.txt"
