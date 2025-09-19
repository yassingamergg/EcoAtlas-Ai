@echo off
echo 🛑 Stopping EcoAtlas System...

REM Stop React app
echo Stopping React Frontend...
taskkill /f /im node.exe /fi "WINDOWTITLE eq EcoAtlas Frontend*" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ React Frontend stopped
) else (
    echo ❌ React Frontend was not running
)

REM Stop Backend API
echo Stopping Backend API...
taskkill /f /im node.exe /fi "WINDOWTITLE eq EcoAtlas Backend*" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend API stopped
) else (
    echo ❌ Backend API was not running
)

REM Stop MQTT Broker
echo Stopping MQTT Broker...
cd mqtt_broker
docker-compose down >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ MQTT Broker stopped
) else (
    echo ❌ MQTT Broker was not running
)
cd ..

echo 🎉 EcoAtlas System stopped successfully!
pause
