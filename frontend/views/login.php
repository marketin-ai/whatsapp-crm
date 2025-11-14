<?php
$title = APP_NAME . ' - Login';

// Handle login form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Rate limiting
    if (!SecurityHelper::checkRateLimit('login', 5, 300)) {
        Session::setFlash('error', 'Too many login attempts. Please try again later.');
        header('Location: ?route=login');
        exit;
    }
    
    // CSRF validation
    if (!SecurityHelper::validateCSRFToken($_POST['csrf_token'] ?? '')) {
        Session::setFlash('error', 'Invalid request. Please try again.');
        header('Location: ?route=login');
        exit;
    }
    
    $username = SecurityHelper::sanitizeInput($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        Session::setFlash('error', 'Please fill in all fields');
        header('Location: ?route=login');
        exit;
    }
    
    // Call API
    $result = APIClient::post('/auth/login', [
        'username' => $username,
        'password' => $password
    ], false);
    
    if ($result['success']) {
        Session::setUser(
            $result['user'],
            $result['accessToken'],
            $result['refreshToken'] ?? null
        );
        
        SecurityHelper::logSecurityEvent('login_success', ['username' => $username]);
        
        header('Location: ?route=dashboard');
        exit;
    } else {
        SecurityHelper::logSecurityEvent('login_failed', ['username' => $username]);
        Session::setFlash('error', $result['message'] ?? 'Login failed');
        header('Location: ?route=login');
        exit;
    }
}

require __DIR__ . '/includes/header.php';
?>

<div class="auth-container">
    <div class="auth-card">
        <h2>Sign In</h2>
        <p class="auth-subtitle">Welcome back! Please login to your account.</p>
        
        <form method="POST" action="?route=login" class="auth-form" id="loginForm">
            <input type="hidden" name="csrf_token" value="<?php echo SecurityHelper::generateCSRFToken(); ?>">
            
            <div class="form-group">
                <label for="username">Username or Email</label>
                <input 
                    type="text" 
                    id="username" 
                    name="username" 
                    class="form-control" 
                    required 
                    autocomplete="username"
                    autofocus
                >
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    class="form-control" 
                    required 
                    autocomplete="current-password"
                >
            </div>
            
            <button type="submit" class="btn btn-primary btn-block">Sign In</button>
        </form>
        
        <p class="auth-footer">
            Don't have an account? <a href="?route=register">Sign Up</a>
        </p>
    </div>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
