<?php
class Session {
    
    /**
     * Initialize session
     */
    public static function init() {
        if (session_status() === PHP_SESSION_NONE) {
            session_name(SESSION_NAME);
            session_start();
            
            // Regenerate session ID periodically
            if (!isset($_SESSION['initiated'])) {
                session_regenerate_id(true);
                $_SESSION['initiated'] = true;
                $_SESSION['created_at'] = time();
            }
            
            // Check session lifetime
            if (isset($_SESSION['created_at']) && 
                (time() - $_SESSION['created_at']) > SESSION_LIFETIME) {
                self::destroy();
                return;
            }
            
            // Regenerate session ID periodically (every 30 minutes)
            if (isset($_SESSION['last_regeneration']) &&
                (time() - $_SESSION['last_regeneration']) > 1800) {
                session_regenerate_id(true);
                $_SESSION['last_regeneration'] = time();
            } else if (!isset($_SESSION['last_regeneration'])) {
                $_SESSION['last_regeneration'] = time();
            }
            
            // Verify user agent
            if (isset($_SESSION['user_agent'])) {
                if ($_SESSION['user_agent'] !== $_SERVER['HTTP_USER_AGENT']) {
                    self::destroy();
                    return;
                }
            } else {
                $_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'];
            }
        }
    }
    
    /**
     * Set session data
     */
    public static function set($key, $value) {
        $_SESSION[$key] = $value;
    }
    
    /**
     * Get session data
     */
    public static function get($key, $default = null) {
        return $_SESSION[$key] ?? $default;
    }
    
    /**
     * Check if session key exists
     */
    public static function has($key) {
        return isset($_SESSION[$key]);
    }
    
    /**
     * Remove session data
     */
    public static function remove($key) {
        unset($_SESSION[$key]);
    }
    
    /**
     * Check if user is logged in
     */
    public static function isLoggedIn() {
        return isset($_SESSION['user_id']) && isset($_SESSION['access_token']);
    }
    
    /**
     * Set user login
     */
    public static function setUser($userData, $accessToken, $refreshToken = null) {
        session_regenerate_id(true);
        $_SESSION['user_id'] = $userData['id'];
        $_SESSION['username'] = $userData['username'];
        $_SESSION['email'] = $userData['email'];
        $_SESSION['role'] = $userData['role'];
        $_SESSION['access_token'] = $accessToken;
        if ($refreshToken) {
            $_SESSION['refresh_token'] = $refreshToken;
        }
        $_SESSION['login_time'] = time();
    }
    
    /**
     * Get user data
     */
    public static function getUser() {
        if (!self::isLoggedIn()) {
            return null;
        }
        
        return [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'email' => $_SESSION['email'],
            'role' => $_SESSION['role']
        ];
    }
    
    /**
     * Get access token
     */
    public static function getAccessToken() {
        return $_SESSION['access_token'] ?? null;
    }
    
    /**
     * Update access token
     */
    public static function updateAccessToken($newToken) {
        $_SESSION['access_token'] = $newToken;
    }
    
    /**
     * Destroy session
     */
    public static function destroy() {
        $_SESSION = [];
        
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }
        
        session_destroy();
    }
    
    /**
     * Set flash message
     */
    public static function setFlash($type, $message) {
        $_SESSION['flash'] = [
            'type' => $type,
            'message' => $message
        ];
    }
    
    /**
     * Get and clear flash message
     */
    public static function getFlash() {
        if (isset($_SESSION['flash'])) {
            $flash = $_SESSION['flash'];
            unset($_SESSION['flash']);
            return $flash;
        }
        return null;
    }
}
