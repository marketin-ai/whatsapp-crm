# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 16+ (`node --version`)
- ✅ npm (`npm --version`)
- ✅ MySQL 5.7+ (`mysql --version`)
- ✅ PHP 7.4+ (`php --version`)
- ✅ Apache/Nginx web server
- ✅ Chrome/Chromium browser

## Quick Installation (5 minutes)

### Step 1: Backend Setup (2 minutes)

```bash
# Navigate to project
cd whatsapp-crm

# Run automated setup
./setup.sh

# Or manual setup:
npm install
cp .env.example .env
```

### Step 2: Configure Environment (1 minute)

Edit `.env` file:
```bash
nano .env
```

**Minimum Required Configuration:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=whatsapp_crm
JWT_SECRET=change-this-to-random-string-32-chars
JWT_REFRESH_SECRET=change-this-to-another-random-string
```

**Optional (for AI features):**
```env
AI_API_KEY=your-openai-or-anthropic-api-key
AI_MODEL=gpt-4
```

### Step 3: Database Setup (1 minute)

```bash
# Create database
mysql -u root -p
```

```sql
CREATE DATABASE whatsapp_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

Tables will be created automatically on first run!

### Step 4: Start Backend (30 seconds)

```bash
# Production
npm start

# Development (with auto-reload)
npm run dev
```

Server will start on http://localhost:3000

### Step 5: Frontend Setup (30 seconds)

**Option A: Using PHP built-in server (Development)**
```bash
cd frontend
php -S localhost:8080
```

**Option B: Using Apache (Production)**
```bash
# Copy frontend to web directory
sudo cp -r frontend /var/www/html/whatsapp-crm

# Enable mod_rewrite
sudo a2enmod rewrite
sudo systemctl restart apache2
```

**Option C: Using Docker**
```bash
# From project root
docker-compose up -d
```

### Step 6: Access Application

Open your browser:
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000

## First Use

1. **Register Account**
   - Click "Get Started"
   - Create account (remember password requirements!)

2. **Login**
   - Use your credentials

3. **Add WhatsApp Instance**
   - Click "+ Add Instance"
   - Give it a name (e.g., "Customer Support")
   - Enable AI if desired

4. **Connect WhatsApp**
   - Click "Connect" on your instance
   - Scan QR code with WhatsApp on your phone
   - Wait for "Connected" status

5. **Configure AI (Optional)**
   - Go to "AI Settings"
   - Choose provider (OpenAI recommended)
   - Enter your API key
   - Customize prompts
   - Test and save

## Troubleshooting

### Backend won't start
```bash
# Check if port 3000 is available
lsof -i :3000

# Check logs
tail -f logs/app.log
```

### Database connection error
```bash
# Verify MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u root -p -e "SHOW DATABASES;"
```

### QR code doesn't appear
- Check browser console (F12)
- Ensure WebSocket connection is working
- Try a different browser
- Check if port 3000 is accessible

### WhatsApp won't connect
```bash
# Install Chromium (if missing)
# Ubuntu/Debian:
sudo apt-get install chromium-browser

# CentOS/RHEL:
sudo yum install chromium

# Check sessions directory
ls -la sessions/
```

## Docker Quick Start

```bash
# Create .env file
cp .env.example .env
# Edit .env with your settings

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access:
- Frontend: http://localhost:8080
- Backend: http://localhost:3000

## Production Deployment Checklist

- [ ] Change all secrets in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall
- [ ] Set up database backups
- [ ] Configure domain name
- [ ] Enable all security headers
- [ ] Set up monitoring
- [ ] Configure log rotation
- [ ] Test all features
- [ ] Create admin account

## Useful Commands

```bash
# Backend
npm start              # Start production server
npm run dev           # Start development server

# Database
npm run db:reset      # Reset database (if implemented)

# Logs
tail -f logs/app.log              # Application logs
tail -f logs/error.log            # Error logs
tail -f frontend/logs/security.log # Security logs

# PM2 (for production)
npm install -g pm2
pm2 start server.js --name whatsapp-crm
pm2 save
pm2 startup
```

## Need Help?

1. Check `README.md` for detailed documentation
2. Review logs in `logs/` directory
3. Check `SECURITY.md` for security best practices
4. Verify all prerequisites are installed

## Features Overview

Once running, you can:
- ✅ Connect multiple WhatsApp accounts
- ✅ Scan QR codes to link devices
- ✅ Send and receive messages
- ✅ View conversation history
- ✅ Manage contacts with notes/tags
- ✅ Enable AI auto-responses
- ✅ Customize AI behavior
- ✅ Track all messages
- ✅ Real-time notifications

## Default Ports

- Backend API: 3000
- Frontend: 8080 (PHP) or 80 (Apache)
- MySQL: 3306
- WebSocket: 3000 (same as backend)

## API Endpoints

Test backend is running:
```bash
curl http://localhost:3000/health
```

Should return: `{"status":"ok","timestamp":"..."}`

---

**🎉 You're all set! Enjoy using WhatsApp CRM!**

For detailed documentation, see `README.md`
