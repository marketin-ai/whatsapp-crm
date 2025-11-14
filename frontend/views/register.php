<?php
$title = APP_NAME . ' - Register';

// Handle registration form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Rate limiting
    if (!SecurityHelper::checkRateLimit('register', 3, 3600)) {
        Session::setFlash('error', 'Too many registration attempts. Please try again later.');
        header('Location: ?route=register');
        exit;
    }
    
    // CSRF validation
    if (!SecurityHelper::validateCSRFToken($_POST['csrf_token'] ?? '')) {
        Session::setFlash('error', 'Invalid request. Please try again.');
        header('Location: ?route=register');
        exit;
    }
    
    $username = SecurityHelper::sanitizeInput($_POST['username'] ?? '');
    $email = SecurityHelper::sanitizeInput($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';
    $fullName = SecurityHelper::sanitizeInput($_POST['full_name'] ?? '');
    
    // Validation
    $errors = [];
    
    if (empty($username) || strlen($username) < 3) {
        $errors[] = 'Username must be at least 3 characters';
    }
    
    if (!SecurityHelper::validateEmail($email)) {
        $errors[] = 'Invalid email address';
    }
    
    if (!SecurityHelper::validatePassword($password)) {
        $errors[] = 'Password must be at least 8 characters with uppercase, lowercase, number and special character';
    }
    
    if ($password !== $confirmPassword) {
        $errors[] = 'Passwords do not match';
    }
    
    if (!empty($errors)) {
        Session::setFlash('error', implode('<br>', $errors));
        header('Location: ?route=register');
        exit;
    }
    
    // Call API
    $result = APIClient::post('/auth/register', [
        'username' => $username,
        'email' => $email,
        'password' => $password,
        'full_name' => $fullName
    ], false);
    
    if ($result['success']) {
        SecurityHelper::logSecurityEvent('registration_success', ['username' => $username]);
        Session::setFlash('success', 'Registration successful! Please login.');
        header('Location: ?route=login');
        exit;
    } else {
        SecurityHelper::logSecurityEvent('registration_failed', ['username' => $username]);
        $message = $result['message'] ?? 'Registration failed';
        if (isset($result['errors']) && is_array($result['errors'])) {
            $message = implode('<br>', array_column($result['errors'], 'msg'));
        }
        Session::setFlash('error', $message);
        header('Location: ?route=register');
        exit;
    }
}

require __DIR__ . '/includes/header.php';
?>

<div class="auth-container">
    <div class="auth-card">
        <h2>Create Account</h2>
        <p class="auth-subtitle">Join us today and start managing your WhatsApp accounts</p>
        
        <form method="POST" action="?route=register" class="auth-form" id="registerForm">
            <input type="hidden" name="csrf_token" value="<?php echo SecurityHelper::generateCSRFToken(); ?>">
            
            <div class="form-group">
                <label for="username">Username *</label>
                <input 
                    type="text" 
                    id="username" 
                    name="username" 
                    class="form-control" 
                    required 
                    minlength="3"
                    pattern="[a-zA-Z0-9_]+"
                    title="Username can only contain letters, numbers and underscores"
                    autocomplete="username"
                >
            </div>
            
            <div class="form-group">
                <label for="email">Email *</label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    class="form-control" 
                    required
                    autocomplete="email"
                >
            </div>
            
            <div class="form-group">
                <label for="full_name">Full Name</label>
                <input 
                    type="text" 
                    id="full_name" 
                    name="full_name" 
                    class="form-control"
                    autocomplete="name"
                >
            </div>
            
            <div class="form-group">
                <label for="password">Password *</label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    class="form-control" 
                    required 
                    minlength="8"
                    autocomplete="new-password"
                >
                <small class="form-text">At least 8 characters with uppercase, lowercase, number and special character</small>
            </div>
            
            <div class="form-group">
                <label for="confirm_password">Confirm Password *</label>
                <input 
                    type="password" 
                    id="confirm_password" 
                    name="confirm_password" 
                    class="form-control" 
                    required
                    autocomplete="new-password"
                >
            </div>
            
            <button type="submit" class="btn btn-primary btn-block">Create Account</button>
        </form>
        
        <p class="auth-footer">
            Already have an account? <a href="?route=login">Sign In</a>
        </p>
    </div>
</div>

<script>
document.getElementById('registerForm').addEventListener('submit', function(e) {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    
    if (password !== confirmPassword) {
        e.preventDefault();
        alert('Passwords do not match!');
        return false;
    }
});
</script>

<?php require __DIR__ . '/includes/footer.php'; ?>
