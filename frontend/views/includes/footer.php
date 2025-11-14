    </div>
    
    <script src="assets/js/main.js"></script>
    <?php if (isset($extra_js)): ?>
        <?php foreach ($extra_js as $js): ?>
            <script src="<?php echo SecurityHelper::escape($js); ?>"></script>
        <?php endforeach; ?>
    <?php endif; ?>
    
    <script>
        // Hide flash message after 5 seconds
        setTimeout(() => {
            const flashMsg = document.getElementById('flash-message');
            if (flashMsg) {
                flashMsg.style.display = 'none';
            }
        }, 5000);
    </script>
</body>
</html>
