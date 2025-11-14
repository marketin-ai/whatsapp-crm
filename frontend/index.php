<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/SecurityHelper.php';
require_once __DIR__ . '/includes/Session.php';
require_once __DIR__ . '/includes/APIClient.php';

Session::init();

// Get route
$route = $_GET['route'] ?? 'home';
$route = SecurityHelper::sanitizeInput($route);

// Route handling
switch ($route) {
    case 'home':
        if (Session::isLoggedIn()) {
            header('Location: ?route=dashboard');
            exit;
        }
        require __DIR__ . '/views/home.php';
        break;
        
    case 'login':
        if (Session::isLoggedIn()) {
            header('Location: ?route=dashboard');
            exit;
        }
        require __DIR__ . '/views/login.php';
        break;
        
    case 'register':
        if (Session::isLoggedIn()) {
            header('Location: ?route=dashboard');
            exit;
        }
        require __DIR__ . '/views/register.php';
        break;
        
    case 'dashboard':
        if (!Session::isLoggedIn()) {
            header('Location: ?route=login');
            exit;
        }
        require __DIR__ . '/views/dashboard.php';
        break;
        
    case 'logout':
        Session::destroy();
        header('Location: ?route=home');
        exit;
        
    default:
        http_response_code(404);
        require __DIR__ . '/views/404.php';
        break;
}
