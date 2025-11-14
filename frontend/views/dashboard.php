<?php
$title = APP_NAME . ' - Dashboard';
$user = Session::getUser();
$extra_js = ['assets/js/dashboard.js'];

require __DIR__ . '/includes/header.php';
?>

<div class="dashboard">
    <!-- Top Navigation -->
    <nav class="top-nav">
        <div class="nav-left">
            <h1><?php echo APP_NAME; ?></h1>
        </div>
        <div class="nav-right">
            <span class="user-info">
                Welcome, <strong><?php echo SecurityHelper::escape($user['username']); ?></strong>
            </span>
            <a href="?route=logout" class="btn btn-sm btn-danger">Logout</a>
        </div>
    </nav>
    
    <!-- Main Dashboard Content -->
    <div class="dashboard-container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <ul class="sidebar-menu">
                <li class="menu-item active" data-section="instances">
                    <span class="menu-icon">📱</span>
                    <span>WhatsApp Instances</span>
                </li>
                <li class="menu-item" data-section="messages">
                    <span class="menu-icon">💬</span>
                    <span>Messages</span>
                </li>
                <li class="menu-item" data-section="contacts">
                    <span class="menu-icon">👥</span>
                    <span>Contacts</span>
                </li>
                <li class="menu-item" data-section="ai-settings">
                    <span class="menu-icon">🤖</span>
                    <span>AI Settings</span>
                </li>
            </ul>
        </aside>
        
        <!-- Main Content Area -->
        <main class="main-content">
            <!-- WhatsApp Instances Section -->
            <div id="instances-section" class="content-section active">
                <div class="section-header">
                    <h2>WhatsApp Instances</h2>
                    <button class="btn btn-primary" id="addInstanceBtn">
                        <span>+ Add Instance</span>
                    </button>
                </div>
                
                <div id="instancesList" class="instances-grid">
                    <div class="loading">Loading instances...</div>
                </div>
            </div>
            
            <!-- Messages Section -->
            <div id="messages-section" class="content-section">
                <div class="section-header">
                    <h2>Messages</h2>
                    <select id="instanceSelector" class="form-control" style="max-width: 250px;">
                        <option value="">Select Instance</option>
                    </select>
                </div>
                
                <div class="messages-container">
                    <div class="contacts-list" id="contactsList">
                        <div class="no-data">Select an instance to view contacts</div>
                    </div>
                    
                    <div class="chat-area" id="chatArea">
                        <div class="no-data">Select a contact to view messages</div>
                    </div>
                </div>
            </div>
            
            <!-- Contacts Section -->
            <div id="contacts-section" class="content-section">
                <div class="section-header">
                    <h2>Contacts</h2>
                    <select id="contactsInstanceSelector" class="form-control" style="max-width: 250px;">
                        <option value="">Select Instance</option>
                    </select>
                </div>
                
                <div id="contactsTable" class="contacts-table">
                    <div class="no-data">Select an instance to view contacts</div>
                </div>
            </div>
            
            <!-- AI Settings Section -->
            <div id="ai-settings-section" class="content-section">
                <div class="section-header">
                    <h2>AI Settings</h2>
                </div>
                
                <form id="aiSettingsForm" class="settings-form">
                    <div class="form-group">
                        <label for="api_provider">AI Provider</label>
                        <select id="api_provider" name="api_provider" class="form-control">
                            <option value="openai">OpenAI (GPT-4, GPT-3.5)</option>
                            <option value="anthropic">Anthropic (Claude)</option>
                            <option value="google">Google AI (Gemini)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="api_key">API Key</label>
                        <input type="password" id="api_key" name="api_key" class="form-control" placeholder="Enter your API key">
                        <small class="form-text">Your API key is encrypted and stored securely</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="model">Model</label>
                        <input type="text" id="model" name="model" class="form-control" placeholder="e.g., gpt-4, claude-3-sonnet-20240229">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="temperature">Temperature</label>
                            <input type="number" id="temperature" name="temperature" class="form-control" min="0" max="2" step="0.1" value="0.7">
                        </div>
                        
                        <div class="form-group">
                            <label for="max_tokens">Max Tokens</label>
                            <input type="number" id="max_tokens" name="max_tokens" class="form-control" min="50" max="4000" step="50" value="500">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="system_prompt">System Prompt</label>
                        <textarea id="system_prompt" name="system_prompt" class="form-control" rows="4" placeholder="You are a helpful customer service assistant..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="custom_instructions">Custom Instructions</label>
                        <textarea id="custom_instructions" name="custom_instructions" class="form-control" rows="3" placeholder="Additional instructions for AI..."></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" id="testAIBtn" class="btn btn-secondary">Test AI</button>
                        <button type="submit" class="btn btn-primary">Save Settings</button>
                    </div>
                </form>
            </div>
        </main>
    </div>
</div>

<!-- Add Instance Modal -->
<div id="addInstanceModal" class="modal">
    <div class="modal-content">
        <span class="modal-close">&times;</span>
        <h3>Add WhatsApp Instance</h3>
        <form id="addInstanceForm">
            <div class="form-group">
                <label for="instance_name">Instance Name *</label>
                <input type="text" id="instance_name" name="instance_name" class="form-control" required>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" id="ai_enabled" name="ai_enabled" checked>
                    Enable AI Responses
                </label>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" id="auto_reply" name="auto_reply">
                    Auto Reply (Automatically respond to messages)
                </label>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block">Create Instance</button>
        </form>
    </div>
</div>

<!-- QR Code Modal -->
<div id="qrModal" class="modal">
    <div class="modal-content">
        <span class="modal-close">&times;</span>
        <h3>Scan QR Code</h3>
        <p>Scan this QR code with your WhatsApp mobile app</p>
        <div id="qrCodeContainer" class="qr-container">
            <div class="loading">Generating QR code...</div>
        </div>
        <p class="qr-instructions">
            Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
        </p>
    </div>
</div>

<!-- Send Message Modal -->
<div id="sendMessageModal" class="modal">
    <div class="modal-content">
        <span class="modal-close">&times;</span>
        <h3>Send Message</h3>
        <form id="sendMessageForm">
            <input type="hidden" id="send_instance_id" name="instance_id">
            <input type="hidden" id="send_phone" name="phone">
            
            <div class="form-group">
                <label for="message_text">Message</label>
                <textarea id="message_text" name="message" class="form-control" rows="4" required></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary btn-block">Send</button>
        </form>
    </div>
</div>

<script>
// Pass user data to JavaScript
window.userData = <?php echo json_encode($user); ?>;
window.apiUrl = '<?php echo API_URL; ?>';
window.csrfToken = '<?php echo SecurityHelper::generateCSRFToken(); ?>';
</script>

<?php require __DIR__ . '/includes/footer.php'; ?>
