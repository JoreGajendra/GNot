@echo off
echo Building Spring Boot SSE Backend...

REM Clean previous builds
call mvn clean

REM Package the application
call mvn package -DskipTests

echo.
echo Build complete!
echo The JAR file is available in the target directory

REM Check if the build was successful
if exist "target\sse-0.0.1-SNAPSHOT.jar" (
    echo You can run the application with: java -jar target\sse-0.0.1-SNAPSHOT.jar
) else (
    echo Build may have failed. Please check the logs above.
)

pause