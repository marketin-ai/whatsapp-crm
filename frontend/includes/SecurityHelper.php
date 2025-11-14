<?php
class SecurityHelper {
    
    /**
     * Sanitize user input
     */
    public static function sanitizeInput($data) {
        if (is_array($data)) {
            return array_map([self::class, 'sanitizeInput'], $data);
        }
        
        $data = trim($data);
        $data = stripslashes($data);
        $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
        
        return $data;
    }
    
    /**
     * Generate CSRF token
     */
    public static function generateCSRFToken() {
        if (empty($_SESSION[CSRF_TOKEN_NAME])) {
            $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
        }
        return $_SESSION[CSRF_TOKEN_NAME];
    }
    
    /**
     * Validate CSRF token
     */
    public static function validateCSRFToken($token) {
        if (empty($_SESSION[CSRF_TOKEN_NAME]) || empty($token)) {
            return false;
        }
        
        return hash_equals($_SESSION[CSRF_TOKEN_NAME], $token);
    }
    
    /**
     * Escape HTML output
     */
    public static function escape($data) {
        return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Validate email
     */
    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL);
    }
    
    /**
     * Validate password strength
     */
    public static function validatePassword($password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
        $pattern = '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/';
        return preg_match($pattern, $password);
    }
    
    /**
     * Hash password
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }
    
    /**
     * Verify password
     */
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
    
    /**
     * Generate random string
     */
    public static function generateRandomString($length = 32) {
        return bin2hex(random_bytes($length / 2));
    }
    
    /**
     * Prevent XSS attacks
     */
    public static function cleanHTML($html) {
        // Strip all tags except safe ones
        $allowed_tags = '<p><br><strong><em><u><a><ul><ol><li>';
        return strip_tags($html, $allowed_tags);
    }
    
    /**
     * Rate limiting check
     */
    public static function checkRateLimit($action, $limit = 5, $window = 300) {
        $key = $action . '_' . $_SERVER['REMOTE_ADDR'];
        
        if (!isset($_SESSION['rate_limit'][$key])) {
            $_SESSION['rate_limit'][$key] = [
                'count' => 1,
                'start_time' => time()
            ];
            return true;
        }
        
        $data = $_SESSION['rate_limit'][$key];
        
        // Reset if window expired
        if (time() - $data['start_time'] > $window) {
            $_SESSION['rate_limit'][$key] = [
                'count' => 1,
                'start_time' => time()
            ];
            return true;
        }
        
        // Check limit
        if ($data['count'] >= $limit) {
            return false;
        }
        
        $_SESSION['rate_limit'][$key]['count']++;
        return true;
    }
    
    /**
     * Log security event
     */
    public static function logSecurityEvent($event, $details = []) {
        $log_entry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'event' => $event,
            'ip' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'details' => $details
        ];
        
        $log_file = __DIR__ . '/../logs/security.log';
        $log_dir = dirname($log_file);
        
        if (!file_exists($log_dir)) {
            mkdir($log_dir, 0755, true);
        }
        
        file_put_contents(
            $log_file,
            json_encode($log_entry) . PHP_EOL,
            FILE_APPEND | LOCK_EX
        );
    }
}
