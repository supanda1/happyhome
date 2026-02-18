#!/bin/bash

echo "🚀 Setting up Household Services Mobile Apps..."

# Check Node.js version
NODE_VERSION=$(node --version)
echo "Node.js version: $NODE_VERSION"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check npm version
NPM_VERSION=$(npm --version)
echo "npm version: $NPM_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment file
if [ ! -f ".env" ]; then
    echo "🔧 Creating environment configuration..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your configuration."
else
    echo "✅ Environment file already exists."
fi

# Bootstrap packages
echo "🔨 Building shared packages..."
npm run bootstrap

# Install Expo CLI if not present
if ! command -v expo &> /dev/null; then
    echo "📱 Installing Expo CLI..."
    npm install -g @expo/cli
else
    echo "✅ Expo CLI already installed."
fi

# Install EAS CLI if not present
if ! command -v eas &> /dev/null; then
    echo "🏗️ Installing EAS CLI..."
    npm install -g eas-cli
else
    echo "✅ EAS CLI already installed."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start Engineer app: npm run dev:engineer"
echo "3. Start Customer app: npm run dev:customer"
echo ""
echo "Available commands:"
echo "- npm run dev:engineer     # Start Engineer app"
echo "- npm run dev:customer     # Start Customer app"
echo "- npm run test            # Run all tests"
echo "- npm run lint            # Lint all code"
echo "- npm run type-check      # Check TypeScript"
echo ""
echo "📚 Read README.md for detailed documentation."