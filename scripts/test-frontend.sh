#!/bin/bash
set -e

echo "Running frontend tests..."
cd "$(dirname "$0")/../frontend"
npx vitest run
