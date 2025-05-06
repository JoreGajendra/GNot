@echo off
echo Building React SSE Client Frontend...

REM Install dependencies (if needed)
echo Installing dependencies...
call npm install

REM Create production build
echo Creating production build...
call npm run build

echo.
echo Build complete!
echo The production build is available in the build directory

REM Check if the build was successful
if exist "build" (
    echo You can deploy the contents of the build directory to your web server
) else (
    echo Build may have failed. Please check the logs above.
)

pause