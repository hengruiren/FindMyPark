#!/bin/bash

# FindMyPark NYC - Quick Start Script
# This script starts the backend server

echo "=========================================="
echo "FindMyPark NYC - Starting Server"
echo "=========================================="
echo ""

# Navigate to Server directory
cd "$(dirname "$0")/Server"

# Check if .env exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found!"
    echo "Please create Server/.env with database configuration"
    echo ""
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Start the server
echo "Starting server..."
echo ""
npm start



