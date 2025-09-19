#!/bin/bash

# EcoAtlas System Shutdown Script

echo "🛑 Stopping EcoAtlas System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop React app
echo -e "${YELLOW}Stopping React Frontend...${NC}"
pkill -f "react-scripts start" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ React Frontend stopped${NC}"
else
    echo -e "${RED}❌ React Frontend was not running${NC}"
fi

# Stop Backend API
echo -e "${YELLOW}Stopping Backend API...${NC}"
pkill -f "node.*server.js" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend API stopped${NC}"
else
    echo -e "${RED}❌ Backend API was not running${NC}"
fi

# Stop MQTT Broker
echo -e "${YELLOW}Stopping MQTT Broker...${NC}"
cd mqtt_broker/
docker-compose down 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ MQTT Broker stopped${NC}"
else
    echo -e "${RED}❌ MQTT Broker was not running${NC}"
fi
cd ..

echo -e "${GREEN}🎉 EcoAtlas System stopped successfully!${NC}"
