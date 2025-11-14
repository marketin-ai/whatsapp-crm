#!/bin/bash

# WhatsApp CRM Setup Script

echo "==================================="
echo "WhatsApp CRM - Setup Script"
echo "==================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed. Please install MySQL first."
    exit 1
fi

echo "✅ MySQL is installed"

# Install Node.js dependencies
echo ""
echo "📦 Installing Node.js dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
    echo "   nano .env"
fi

# Create necessary directories
echo ""
echo "📁 Creating directories..."
mkdir -p sessions logs uploads frontend/logs

echo "✅ Directories created"

# Set permissions
echo ""
echo "🔒 Setting permissions..."
chmod 755 frontend/
chmod 644 frontend/*.php
chmod 777 frontend/logs
chmod 777 logs
chmod 777 sessions
chmod 777 uploads

echo "✅ Permissions set"

# Database setup
echo ""
echo "🗄️  Database Setup"
read -p "Do you want to create the MySQL database now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter MySQL root password: " -s MYSQL_ROOT_PASSWORD
    echo
    read -p "Enter database name (default: whatsapp_crm): " DB_NAME
    DB_NAME=${DB_NAME:-whatsapp_crm}
    
    mysql -u root -p$MYSQL_ROOT_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database created successfully"
    else
        echo "❌ Failed to create database"
    fi
fi

echo ""
echo "==================================="
echo "✅ Setup Complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start the backend: npm start"
echo "3. Configure your web server to point to the 'frontend' directory"
echo "4. Access the application in your browser"
echo ""
echo "For development:"
echo "  npm run dev"
echo ""
echo "Documentation: README.md"
echo ""
