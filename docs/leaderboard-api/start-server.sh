#!/bin/bash

# Start the leaderboard API server
echo "Starting BioReader Leaderboard API Server..."
echo "Installing dependencies..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "Starting server on port 3001..."
echo "API will be available at: http://localhost:3001/api"
echo "Health check: http://localhost:3001/api/health"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm start
