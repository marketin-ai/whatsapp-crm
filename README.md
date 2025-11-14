# WhatsApp CRM - Multi-Instance with AI Integration

A comprehensive WhatsApp CRM system that allows users to connect multiple WhatsApp accounts, manage conversations, and leverage AI-powered automated responses.

## Features

### 🚀 Core Features
- **Multi-WhatsApp Integration**: Connect and manage unlimited WhatsApp accounts
- **AI-Powered Responses**: Automated intelligent responses using OpenAI, Anthropic, or Google AI
- **Real-Time Messaging**: Send and receive messages with instant notifications via WebSocket
- **Contact Management**: Organize contacts with tags, notes, and conversation history
- **QR Code Authentication**: Easy WhatsApp connection via QR code scanning
- **Message History**: Complete conversation tracking and history

### 🔒 Security Features
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Password Encryption**: Bcrypt hashing with configurable rounds
- **CSRF Protection**: Cross-Site Request Forgery prevention
- **Rate Limiting**: API and login attempt rate limiting
- **Session Management**: Secure session handling with regeneration
- **Input Sanitization**: XSS and SQL injection prevention
- **Security Headers**: Helmet.js security headers
- **Audit Logging**: Complete security event logging

### 🏗️ Architecture
- **Backend**: Node.js with Express
- **Frontend**: PHP with modern responsive design
- **Database**: MySQL with connection pooling
- **Real-time**: Socket.IO for WebSocket communication
- **WhatsApp**: whatsapp-web.js for WhatsApp Web API

## Project Structure

```
whatsapp-crm/
├── backend (Node.js)
│   ├── server.js                 # Main server file
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── whatsapp.js          # WhatsApp instance routes
│   │   ├── messages.js          # Message routes
│   │   ├── contacts.js          # Contact routes
│   │   ├── ai.js                # AI settings routes
│   │   └── users.js             # User management routes
│   ├── services/
│   │   ├── whatsappService.js   # WhatsApp integration service
│   │   └── aiService.js         # AI response service
│   ├── utils/
│   │   └── logger.js            # Winston logger
│   └── package.json
│
└── frontend (PHP)
    ├── index.php                # Router
    ├── config.php               # Configuration
    ├── .htaccess               # Apache configuration
    ├── includes/
    │   ├── SecurityHelper.php  # Security utilities
    │   ├── Session.php         # Session management
    │   └── APIClient.php       # API client
    ├── views/
    │   ├── home.php            # Home page
    │   ├── login.php           # Login page
    │   ├── register.php        # Registration page
    │   ├── dashboard.php       # Dashboard
    │   └── 404.php             # Error page
    └── assets/
        ├── css/
        │   └── style.css       # Main stylesheet
        └── js/
            ├── main.js         # Main JavaScript
            └── dashboard.js    # Dashboard JavaScript
```

## Installation

### Prerequisites
- Node.js 16+ and npm
- PHP 7.4+
- MySQL 5.7+
- Apache/Nginx web server
- Chrome/Chromium (for WhatsApp Web)

### Backend Setup

1. **Navigate to project directory**
```bash
cd whatsapp-crm
```

2. **Install Node.js dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=whatsapp_crm

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# AI API (Optional)
AI_API_KEY=your-openai-api-key

# Server
PORT=3000
```

4. **Create MySQL database**
```sql
CREATE DATABASE whatsapp_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. **Start the backend server**
```bash
npm start
# or for development
npm run dev
```

The backend will automatically create all necessary database tables on first run.

### Frontend Setup

1. **Configure web server**

For Apache, ensure `.htaccess` is enabled and `mod_rewrite` is active:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

2. **Update API configuration**

Edit `frontend/config.php`:
```php
define('API_URL', 'http://localhost:3000/api');
```

3. **Set permissions**
```bash
chmod 755 frontend/
chmod 644 frontend/*.php
mkdir -p frontend/logs
chmod 777 frontend/logs
```

4. **Access the application**
```
http://localhost/whatsapp-crm/frontend
```

## Usage

### 1. Register an Account
- Navigate to the registration page
- Create an account with username, email, and secure password
- Password must contain uppercase, lowercase, number, and special character

### 2. Login
- Use your credentials to login
- JWT tokens are automatically managed

### 3. Add WhatsApp Instance
- Click "Add Instance" in the dashboard
- Give your instance a name
- Enable AI responses and auto-reply if desired
- Click "Create Instance"

### 4. Connect WhatsApp
- Click "Connect" on your instance
- Scan the QR code with WhatsApp on your phone
- Go to: WhatsApp → Settings → Linked Devices → Link a Device
- Instance will show "Connected" when successful

### 5. Configure AI (Optional)
- Go to "AI Settings" in the sidebar
- Choose your AI provider (OpenAI, Anthropic, or Google)
- Enter your API key
- Customize the system prompt and instructions
- Test the AI responses
- Save settings

### 6. Manage Messages
- Select an instance from the dropdown
- View all contacts
- Click on a contact to see message history
- Send messages manually
- AI will auto-respond if enabled

## AI Configuration

### OpenAI
```
Provider: openai
Model: gpt-4, gpt-3.5-turbo
API Key: From https://platform.openai.com/api-keys
```

### Anthropic (Claude)
```
Provider: anthropic
Model: claude-3-sonnet-20240229, claude-3-opus-20240229
API Key: From https://console.anthropic.com/
```

### Google AI
```
Provider: google
Model: gemini-pro
API Key: From https://makersuite.google.com/app/apikey
```

## Security Best Practices

1. **Production Deployment**
   - Change all default secrets in `.env`
   - Enable HTTPS (SSL/TLS)
   - Set `session.cookie_secure` to 1 in PHP
   - Disable PHP error display
   - Use strong database passwords
   - Configure firewall rules

2. **Database Security**
   - Use separate database user with minimal privileges
   - Enable MySQL SSL connections
   - Regular backups

3. **API Keys**
   - Never commit `.env` to version control
   - Rotate keys regularly
   - Use environment-specific keys

4. **Server Hardening**
   - Keep all software updated
   - Disable unnecessary services
   - Configure CSP headers
   - Enable rate limiting

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### WhatsApp
- `POST /api/whatsapp/instance` - Create instance
- `GET /api/whatsapp/instances` - Get all instances
- `GET /api/whatsapp/instance/:id` - Get instance details
- `POST /api/whatsapp/instance/:id/connect` - Connect instance
- `POST /api/whatsapp/instance/:id/disconnect` - Disconnect instance
- `PATCH /api/whatsapp/instance/:id` - Update instance
- `DELETE /api/whatsapp/instance/:id` - Delete instance
- `POST /api/whatsapp/instance/:id/send` - Send message

### Messages & Contacts
- `GET /api/messages` - Get messages
- `GET /api/contacts` - Get contacts
- `PATCH /api/contacts/:id` - Update contact

### AI
- `GET /api/ai/settings` - Get AI settings
- `PUT /api/ai/settings` - Update AI settings
- `POST /api/ai/test` - Test AI response

## Troubleshooting

### WhatsApp Connection Issues
- Ensure Chrome/Chromium is installed
- Check if ports are open (3000 for backend)
- Try deleting session files and reconnecting
- Verify WhatsApp is not connected on another device

### Database Connection Failed
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists
- Check MySQL user permissions

### QR Code Not Appearing
- Check WebSocket connection (Socket.IO)
- Verify CORS settings
- Check browser console for errors

### AI Not Responding
- Verify API key is correct
- Check API provider status
- Review rate limits
- Check logs for errors

## Development

### Run in Development Mode
```bash
# Backend with auto-reload
npm run dev

# Watch logs
tail -f logs/app.log
```

### Database Migrations
Tables are automatically created on first run. To reset:
```sql
DROP DATABASE whatsapp_crm;
CREATE DATABASE whatsapp_crm;
```

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues and questions:
- Check the troubleshooting section
- Review logs in `logs/` directory
- Check security logs for authentication issues

## Credits

Built with:
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- [Socket.IO](https://socket.io/)
- [MySQL](https://www.mysql.com/)

## Version

Current Version: 1.0.0

---

**⚠️ Important Security Notes:**
- Always use HTTPS in production
- Never expose `.env` files
- Regularly update dependencies
- Enable all security headers
- Use strong passwords and secrets
- Monitor audit logs regularly
