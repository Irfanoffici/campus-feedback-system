#!/bin/bash

echo "🎯 Setting up Campus Feedback System Development Environment"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if in right directory
if [ ! -f "backend/package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd backend
npm install

# Create environment file
if [ ! -f ".env" ]; then
    echo "🔧 Creating environment file..."
    cat > .env << EOL
NODE_ENV=development
PORT=3000
DB_TYPE=sqlite
EOL
    echo "✅ Created .env file"
fi

echo ""
echo "🎉 Environment setup complete!"
echo "🚀 To start the application:"
echo "   cd backend && npm start"
echo ""
echo "📊 Access points:"
echo "   Main App: http://localhost:3000"
echo "   Admin: http://localhost:3000/admin"
echo "   API Health: http://localhost:3000/api/health"