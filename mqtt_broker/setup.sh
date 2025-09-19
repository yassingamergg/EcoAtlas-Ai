#!/bin/bash

# EcoAtlas MQTT Broker Setup Script

echo "Setting up EcoAtlas MQTT Broker..."

# Create directories
mkdir -p data logs

# Create password file for MQTT authentication
echo "Creating MQTT user credentials..."
mosquitto_passwd -c passwd ecoatlas
echo "Password for 'ecoatlas' user: ecoatlas123"

# Set permissions
chmod 755 data logs
chmod 644 mosquitto.conf passwd

# Start the MQTT broker
echo "Starting MQTT broker..."
docker-compose up -d

echo "MQTT Broker setup complete!"
echo "Broker running on: localhost:1883"
echo "WebSocket on: localhost:9001"
echo "Dashboard on: http://localhost:3001"
echo ""
echo "Test connection with:"
echo "mosquitto_pub -h localhost -t test/topic -m 'Hello EcoAtlas' -u ecoatlas -P ecoatlas123"
