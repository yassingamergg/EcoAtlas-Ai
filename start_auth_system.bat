@echo off
echo Starting EcoAtlas AI Authentication System...
echo.

echo [1/3] Starting Authentication Backend...
cd backend
start "Auth Backend" cmd /k "npm install && npm start"
cd ..

echo [2/3] Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo [3/3] Starting Frontend...
start "EcoAtlas Frontend" cmd /k "npm start"

echo.
echo ✅ EcoAtlas AI Authentication System Started!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔐 Backend API: http://localhost:3001
echo 📧 Email: Configure in backend/.env
echo.
echo Press any key to exit...
pause > nul



