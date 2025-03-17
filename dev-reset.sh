#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}PDFlexo Development Reset Script${NC}"
echo -e "${YELLOW}====================================${NC}"

# Kill any running Vite processes
echo -e "${GREEN}Killing any running Vite processes...${NC}"
pkill -f vite || echo -e "${RED}No Vite processes found to kill${NC}"

# Clear node_modules/.vite cache
echo -e "${GREEN}Clearing Vite cache...${NC}"
if [ -d "node_modules/.vite" ]; then
  rm -rf node_modules/.vite
  echo -e "${GREEN}Vite cache cleared${NC}"
else
  echo -e "${YELLOW}No Vite cache found${NC}"
fi

# Clear dist directory
echo -e "${GREEN}Clearing dist directory...${NC}"
if [ -d "dist" ]; then
  rm -rf dist
  echo -e "${GREEN}Dist directory cleared${NC}"
else
  echo -e "${YELLOW}No dist directory found${NC}"
fi

# Install dependencies if needed
echo -e "${GREEN}Checking dependencies...${NC}"
if [ ! -d "node_modules" ] || [ "$1" == "--reinstall" ]; then
  echo -e "${GREEN}Installing dependencies...${NC}"
  npm install
else
  echo -e "${GREEN}Dependencies already installed${NC}"
fi

# Build the project
echo -e "${GREEN}Building project...${NC}"
npm run build

# Start the development server
echo -e "${GREEN}Starting development server...${NC}"
npm run dev -- --force

echo -e "${GREEN}Done!${NC}"