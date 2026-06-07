@echo off
echo 🚀 Starting Calendar App...
echo.
echo    Frontend + Backend: http://localhost:8000
echo    API Docs:           http://localhost:8000/docs
echo.
echo    Close this window to stop.
echo.

cd /d D:\calendar-app\backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
