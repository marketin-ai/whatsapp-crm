<?php
// Configuration
define('APP_NAME', 'WhatsApp CRM');
define('APP_VERSION', '1.0.0');

// API Configuration
define('API_URL', 'http://localhost:3000/api');

// Security Configuration
define('SESSION_LIFETIME', 86400); // 24 hours
define('CSRF_TOKEN_NAME', 'csrf_token');
define('SESSION_NAME', 'WHATSAPP_CRM_SESSION');

// Cookie Security
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1); // Set to 1 in production with HTTPS
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.use_strict_mode', 1);

// Timezone
date_default_timezone_set('UTC');

// Error Reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/php-errors.log');

// Create logs directory if it doesn't exist
if (!file_exists(__DIR__ . '/logs')) {
    mkdir(__DIR__ . '/logs', 0755, true);
}
