@echo off
echo Server-Sent Events (SSE) Demo - Starting Servers
echo ===============================================
echo.

echo Starting the Spring Boot Backend and React Frontend in parallel
echo.
echo Backend will be available at: http://localhost:8000
echo Frontend will be available at: http://localhost:5000
echo.
echo Press Ctrl+C to stop the servers
echo.

start "SSE Backend" cmd /c "cd backend && mvn spring-boot:run"
start "SSE Frontend" cmd /c "cd frontend && npm start"

echo Both servers are starting...
echo.
echo Note: Check the individual command windows for any errors or logs
echo.
echo Server windows will remain open until you close them
echo or press Ctrl+C in this window to stop everything.

pause