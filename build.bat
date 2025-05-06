@echo off
echo Server-Sent Events (SSE) Demo - Build Script
echo ============================================
echo.

echo Step 1: Building Backend
echo ----------------------
cd backend
call build.bat
cd ..

echo.
echo Step 2: Building Frontend
echo -----------------------
cd frontend
call build.bat
cd ..

echo.
echo ============================================
echo Build process completed!
echo.
echo You can:
echo - Run the backend with: java -jar backend/target/sse-0.0.1-SNAPSHOT.jar
echo - Serve the frontend from: frontend/build

pause