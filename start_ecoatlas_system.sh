#!/bin/bash

# EcoAtlas Real-time ESP32 System Startup Script
# This script starts all components of the EcoAtlas system

echo "🌱 Starting EcoAtlas Real-time ESP32 System..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites are installed${NC}"

# Start MQTT Broker
echo -e "${BLUE}Starting MQTT Broker...${NC}"
cd mqtt_broker/

if [ ! -f "passwd" ]; then
    echo -e "${YELLOW}Creating MQTT user credentials...${NC}"
    echo "ecoatlas:ecoatlas123" > passwd
fi

docker-compose up -d
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ MQTT Broker started successfully${NC}"
    echo -e "${BLUE}   MQTT Broker: localhost:1883${NC}"
    echo -e "${BLUE}   WebSocket: localhost:9001${NC}"
    echo -e "${BLUE}   Dashboard: http://localhost:3001${NC}"
else
    echo -e "${RED}❌ Failed to start MQTT Broker${NC}"
    exit 1
fi

cd ..

# Start Backend API
echo -e "${BLUE}Starting Backend API...${NC}"
cd backend/

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
fi

# Start backend in background
npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

if port_in_use 5000; then
    echo -e "${GREEN}✅ Backend API started successfully${NC}"
    echo -e "${BLUE}   API: http://localhost:5000${NC}"
    echo -e "${BLUE}   WebSocket: ws://localhost:8080${NC}"
else
    echo -e "${RED}❌ Failed to start Backend API${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

cd ..

# Start React Frontend
echo -e "${BLUE}Starting React Frontend...${NC}"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
fi

# Start React app in background
npm start &
REACT_PID=$!

# Wait for React to start
sleep 10

if port_in_use 3000; then
    echo -e "${GREEN}✅ React Frontend started successfully${NC}"
    echo -e "${BLUE}   Frontend: http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Failed to start React Frontend${NC}"
    kill $REACT_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# System Status
echo ""
echo -e "${GREEN}🎉 EcoAtlas System Started Successfully!${NC}"
echo "================================================"
echo -e "${BLUE}📊 Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}🔌 Backend API:${NC} http://localhost:5000"
echo -e "${BLUE}📡 MQTT Broker:${NC} localhost:1883"
echo -e "${BLUE}📈 MQTT Dashboard:${NC} http://localhost:3001"
echo -e "${BLUE}🔗 WebSocket:${NC} ws://localhost:8080"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Upload ESP32 firmware to your device"
echo "2. Configure WiFi credentials in the firmware"
echo "3. Connect sensors to ESP32"
echo "4. Power on ESP32 device"
echo "5. Check IoT Sensors tab in the frontend"
echo ""
echo -e "${YELLOW}🛑 To stop the system:${NC}"
echo "Press Ctrl+C or run: ./stop_ecoatlas_system.sh"
echo ""

# Keep script running and handle Ctrl+C
trap 'echo -e "\n${YELLOW}Stopping EcoAtlas System...${NC}"; kill $REACT_PID 2>/dev/null; kill $BACKEND_PID 2>/dev/null; cd mqtt_broker && docker-compose down && cd ..; echo -e "${GREEN}✅ System stopped${NC}"; exit 0' INT

# Wait for user to stop
echo -e "${GREEN}System is running... Press Ctrl+C to stop${NC}"
wait
