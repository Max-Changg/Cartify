@echo off
echo 🚀 Starting Cartify Development Environment
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18 or higher.
    exit /b 1
)

echo ✅ Python and Node.js detected
echo.

REM Backend setup
echo 📦 Setting up backend...
cd backend

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install -q -r requirements.txt

echo ✅ Backend setup complete
echo.

REM Frontend setup
echo 📦 Setting up frontend...
cd ..\frontend

if not exist "node_modules" (
    echo Installing Node dependencies...
    call npm install
)

echo ✅ Frontend setup complete
echo.

REM Start servers
echo 🚀 Starting servers...
echo.
echo Backend will run on: http://localhost:8000
echo Frontend will run on: http://localhost:5173
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start backend
cd ..\backend
start cmd /k "call venv\Scripts\activate.bat && python main.py"

REM Start frontend
cd ..\frontend
start cmd /k "npm run dev"

echo.
echo ✅ Development servers started in separate windows
pause
