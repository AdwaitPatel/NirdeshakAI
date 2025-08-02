#!/bin/bash

# Quick Start Script for NirdeshakAI

echo "Setting up NirdeshakAI..."

# Check if .env exists
if [ ! -f "server/.env" ]; then
    echo "Please create server/.env file from server/.env.example and add your API keys"
    exit 1
fi

# Start backend
echo "Starting backend server..."
cd server
python -m venv myenv 2>/dev/null || true
source myenv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend server..."
cd ../client
npm install
npm run dev &
FRONTEND_PID=$!

echo "Backend running on http://localhost:8000"
echo "Frontend running on http://localhost:5173"
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait $BACKEND_PID $FRONTEND_PID
