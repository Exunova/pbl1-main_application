#!/bin/bash
set -e

echo "Installing frontend dependencies..."
cd "$(dirname "$0")/../frontend"
npm install
