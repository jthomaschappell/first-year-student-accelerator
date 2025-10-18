#!/bin/bash

# Start the chatbot with automatic server management

echo "🚀 Starting BYU Chatbot..."
echo ""

# Check if .env.local exists and has API key
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found"
    echo "Create .env.local with: OPENAI_API_KEY=your-key-here"
    exit 1
fi

if grep -q "your-key" .env.local; then
    echo "❌ Error: Please set your actual OpenAI API key in .env.local"
    exit 1
fi

# Kill any existing server on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start dev server in background
echo "Starting Next.js server..."
npm run dev > /dev/null 2>&1 &
SERVER_PID=$!

# Give server time to start
sleep 3

# Start chatbot
node test-chatbot.mjs

# Cleanup: kill server when chatbot exits
kill $SERVER_PID 2>/dev/null

