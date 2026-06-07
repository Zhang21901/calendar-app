@echo off
echo 🚀 Starting Calendar App...
echo.

start "Backend" cmd /k "cd /d D:\calendar-app\backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul
start "Frontend" cmd /k "cd /d D:\calendar-app\frontend && npm run dev"

echo.
echo ✅ Backend:  http://localhost:8000
echo ✅ Frontend: http://localhost:5173
echo.
echo Close the two terminal windows to stop.
