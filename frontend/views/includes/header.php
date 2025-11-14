<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <meta name="description" content="<?php echo APP_NAME; ?> - Multi WhatsApp CRM with AI Integration">
    <title><?php echo $title ?? APP_NAME; ?></title>
    <link rel="stylesheet" href="assets/css/style.css">
    <?php if (isset($extra_css)): ?>
        <?php foreach ($extra_css as $css): ?>
            <link rel="stylesheet" href="<?php echo SecurityHelper::escape($css); ?>">
        <?php endforeach; ?>
    <?php endif; ?>
</head>
<body>
    <?php
    // Display flash messages
    $flash = Session::getFlash();
    if ($flash):
    ?>
    <div class="alert alert-<?php echo SecurityHelper::escape($flash['type']); ?>" id="flash-message">
        <?php echo SecurityHelper::escape($flash['message']); ?>
    </div>
    <?php endif; ?>
    
    <div class="container">
