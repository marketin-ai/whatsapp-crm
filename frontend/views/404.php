<?php
$title = '404 - Page Not Found';
require __DIR__ . '/includes/header.php';
?>

<div class="error-page">
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>The page you are looking for doesn't exist or has been moved.</p>
    <a href="?route=home" class="btn btn-primary">Go Home</a>
</div>

<?php require __DIR__ . '/includes/footer.php'; ?>
