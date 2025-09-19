#!/bin/bash

echo "Starting EcoAtlas AI System..."
echo ""

echo "Starting Backend Server..."
gnome-terminal -- bash -c "cd backend && npm start; exec bash" &

echo "Waiting 3 seconds for backend to start..."
sleep 3

echo "Starting Frontend Server..."
gnome-terminal -- bash -c "npm start; exec bash" &

echo ""
echo "Both servers are starting..."
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

