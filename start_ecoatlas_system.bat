@echo off
echo 🌱 Starting EcoAtlas Real-time ESP32 System...
echo ================================================

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ All prerequisites are installed

REM Start MQTT Broker
echo Starting MQTT Broker...
cd mqtt_broker

REM Create MQTT user credentials if not exists
if not exist passwd (
    echo Creating MQTT user credentials...
    echo ecoatlas:ecoatlas123 > passwd
)

docker-compose up -d
if %errorlevel% equ 0 (
    echo ✅ MQTT Broker started successfully
    echo    MQTT Broker: localhost:1883
    echo    WebSocket: localhost:9001
    echo    Dashboard: http://localhost:3001
) else (
    echo ❌ Failed to start MQTT Broker
    pause
    exit /b 1
)

cd ..

REM Start Backend API
echo Starting Backend API...
cd backend

if not exist node_modules (
    echo Installing backend dependencies...
    npm install
)

start "EcoAtlas Backend" cmd /k "npm start"
timeout /t 5 /nobreak >nul

cd ..

REM Start React Frontend
echo Starting React Frontend...

if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
)

start "EcoAtlas Frontend" cmd /k "npm start"
timeout /t 10 /nobreak >nul

echo.
echo 🎉 EcoAtlas System Started Successfully!
echo ================================================
echo 📊 Frontend: http://localhost:3000
echo 🔌 Backend API: http://localhost:5000
echo 📡 MQTT Broker: localhost:1883
echo 📈 MQTT Dashboard: http://localhost:3001
echo 🔗 WebSocket: ws://localhost:8080
echo.
echo 📋 Next Steps:
echo 1. Upload ESP32 firmware to your device
echo 2. Configure WiFi credentials in the firmware
echo 3. Connect sensors to ESP32
echo 4. Power on ESP32 device
echo 5. Check IoT Sensors tab in the frontend
echo.
echo 🛑 To stop the system, close all command windows or run stop_ecoatlas_system.bat
echo.

pause
