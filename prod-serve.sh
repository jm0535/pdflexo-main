#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}PDFlexo Production Server Script${NC}"
echo -e "${YELLOW}====================================${NC}"

# Check if port is provided
PORT=${1:-5000}

# Build the project
echo -e "${GREEN}Building project for production...${NC}"
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed. Exiting.${NC}"
  exit 1
fi

echo -e "${GREEN}Build successful!${NC}"

# Serve the built project
echo -e "${GREEN}Starting production server on port ${PORT}...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"

# Use a simple HTTP server to serve the files
if command -v npx &> /dev/null; then
  npx serve -s dist -l $PORT
else
  echo -e "${YELLOW}npx not found, using npm run preview instead${NC}"
  npm run preview -- --port $PORT
fi