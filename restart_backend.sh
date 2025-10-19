#!/bin/bash

echo "=================================="
echo "🔄 Restarting Backend Server"
echo "=================================="
echo ""

# Kill all processes on port 8000
echo "🔍 Checking for processes on port 8000..."
PIDS=$(lsof -ti:8000)

if [ ! -z "$PIDS" ]; then
    echo "⚠️  Found processes: $PIDS"
    echo "🔪 Killing processes..."
    kill -9 $PIDS 2>/dev/null
    sleep 2
    echo "✅ Processes killed"
else
    echo "✅ No existing processes found"
fi

# Verify port is free
echo ""
echo "🔍 Verifying port 8000 is free..."
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "❌ Port 8000 is still in use!"
    echo "   Please manually kill the process and try again."
    exit 1
else
    echo "✅ Port 8000 is free"
fi

# Start the backend
echo ""
echo "🚀 Starting backend with latest code..."
echo "=================================="
cd "$(dirname "$0")"

# Activate virtual environment
source /Users/dhanush/Documents/model/Spai/venv/bin/activate

python3 api.py
