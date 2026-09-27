@echo off
echo Starting VectorAfriq Images Service...

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Create uploads directory if it doesn't exist
if not exist "uploads\Properties" (
    echo Creating uploads directory...
    mkdir uploads\Properties
)

REM Copy environment file if it doesn't exist
if not exist ".env" (
    if exist ".env.example" (
        echo Creating .env file from example...
        copy .env.example .env
    )
)

echo Starting service on port 3001...
npm start