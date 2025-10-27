#!/bin/bash

# Launch script for Lotion
echo "🧴 Starting Lotion..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the application
echo "🚀 Launching Lotion..."
npm run start 