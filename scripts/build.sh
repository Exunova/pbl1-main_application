#!/bin/bash

cd "$(dirname "$0")/../frontend"
npm run build
npm run build:exe
