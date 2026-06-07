#!/bin/bash

# Get project root (parent of scripts/)
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Step 1: Create build directory and convert logo.png to icon.ico (skip if exists)
echo "[Build] Creating build directory and converting icon..."
mkdir -p "$PROJECT_ROOT/frontend/build"

if [ -f "$PROJECT_ROOT/frontend/build/icon.ico" ]; then
    echo "[Build] Icon already exists, skipping..."
else
    python3 << EOF
import os
import struct
from PIL import Image
import io

src = os.path.realpath(os.path.join("$PROJECT_ROOT", "logo.png"))
dst = os.path.realpath(os.path.join("$PROJECT_ROOT", "frontend/build/icon.ico"))

img = Image.open(src)
sizes = [256, 128, 64, 48, 32, 16]
images = []

for size in sizes:
    resized = img.resize((size, size), Image.LANCZOS)
    buf = io.BytesIO()
    resized.save(buf, format='PNG')
    images.append((size, buf.getvalue()))

with open(dst, 'wb') as f:
    f.write(struct.pack('<HHH', 0, 1, len(images)))
    offset = 6 + len(images) * 16
    for size, data in images:
        w = 0 if size >= 256 else size
        h = 0 if size >= 256 else size
        f.write(struct.pack('<BBBBHHII', w, h, 0, 0, 1, 32, len(data), offset))
        offset += len(data)
    for size, data in images:
        f.write(data)

print(f"Icon created: {dst}")
EOF
    if [ $? -ne 0 ]; then
        echo "[Build] ERROR: Icon conversion failed"
        exit 1
    fi
fi

# Step 2: Install Playwright browsers (bundled with PLAYWRIGHT_BROWSERS_PATH=0)
echo "[Build] Installing Playwright browsers..."
cd "$PROJECT_ROOT/backend"
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
export PLAYWRIGHT_BROWSERS_PATH=0
pip install playwright 2>/dev/null
playwright install chromium
if [ $? -ne 0 ]; then
    echo "[Build] WARNING: Playwright installation had issues (may already be installed)"
fi

# Step 3: Freeze Python backend with PyInstaller
echo "[Build] Freezing Python backend with PyInstaller..."
cd "$PROJECT_ROOT"
export PLAYWRIGHT_BROWSERS_PATH=0
pyinstaller --onefile --noconsole backend/src/ipc_main.py
if [ $? -ne 0 ]; then
    echo "[Build] ERROR: PyInstaller failed"
    exit 1
fi

# Step 4 & 5: Build frontend and package with electron-builder
echo "[Build] Building frontend..."
cd "$PROJECT_ROOT/frontend"
npm run build
if [ $? -ne 0 ]; then
    echo "[Build] ERROR: Frontend build failed"
    exit 1
fi

echo "[Build] Packaging with electron-builder..."
npm run build:exe
if [ $? -ne 0 ]; then
    echo "[Build] ERROR: electron-builder failed"
    exit 1
fi

echo "[Build] Complete!"