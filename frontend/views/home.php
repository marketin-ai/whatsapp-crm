<?php
$title = APP_NAME . ' - Home';
require __DIR__ . '/includes/header.php';
?>

<div class="hero-section">
    <div class="hero-content">
        <h1>Welcome to <?php echo APP_NAME; ?></h1>
        <p class="hero-subtitle">Manage Multiple WhatsApp Accounts with AI-Powered Responses</p>
        <p class="hero-description">
            Connect unlimited WhatsApp numbers, manage conversations, and let AI handle customer responses automatically.
        </p>
        <div class="hero-buttons">
            <a href="?route=register" class="btn btn-primary">Get Started</a>
            <a href="?route=login" class="btn btn-secondary">Sign In</a>
        </div>
    </div>
</div>

<div class="features-section">
    <h2>Features</h2>
    <div class="features-grid">
        <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3>Multi-WhatsApp Integration</h3>
            <p>Connect and manage multiple WhatsApp accounts from a single dashboard</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">🤖</div>
            <h3>AI-Powered Responses</h3>
            <p>Automated intelligent responses using OpenAI, Anthropic, or Google AI</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">💬</div>
            <h3>Real-Time Messaging</h3>
            <p>Send and receive messages in real-time with instant notifications</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Contact Management</h3>
            <p>Organize contacts with tags, notes, and conversation history</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3>Advanced Security</h3>
            <p>Bank-level encryption and security measures to protect your data</p>
        </div>
        <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>Fast & Reliable</h3>
            <p>Built with modern technology for optimal performance</p>
        </div>
    </div>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
