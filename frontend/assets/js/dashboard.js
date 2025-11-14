// Dashboard JavaScript
let socket = null;
let currentInstance = null;
let currentContact = null;

// Initialize Socket.IO
function initSocket() {
    socket = io('http://localhost:3000', {
        auth: {
            token: getAccessToken()
        }
    });
    
    socket.on('connect', () => {
        console.log('Socket connected');
        socket.emit('join-room', window.userData.id);
    });
    
    socket.on('qr-code', (data) => {
        displayQRCode(data.qrCode);
    });
    
    socket.on('instance-connected', (data) => {
        console.log('Instance connected:', data);
        showNotification('success', 'WhatsApp connected successfully!');
        loadInstances();
        closeModal('qrModal');
    });
    
    socket.on('instance-disconnected', (data) => {
        console.log('Instance disconnected:', data);
        showNotification('warning', 'WhatsApp disconnected');
        loadInstances();
    });
    
    socket.on('new-message', (data) => {
        console.log('New message:', data);
        handleNewMessage(data);
    });
}

// Get access token
function getAccessToken() {
    return sessionStorage.getItem('access_token') || '';
}

// API Request helper
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + getAccessToken()
        }
    };
    
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(window.apiUrl + endpoint, options);
        const result = await response.json();
        
        if (!response.ok && response.status === 401) {
            // Token expired, redirect to login
            window.location.href = '?route=logout';
            return null;
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        showNotification('error', 'Connection error. Please try again.');
        return null;
    }
}

// Show notification
function showNotification(type, message) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Load WhatsApp instances
async function loadInstances() {
    const container = document.getElementById('instancesList');
    container.innerHTML = '<div class="loading">Loading instances...</div>';
    
    const result = await apiRequest('/whatsapp/instances');
    
    if (result && result.success) {
        if (result.instances.length === 0) {
            container.innerHTML = '<div class="no-data">No instances yet. Add your first WhatsApp instance!</div>';
            return;
        }
        
        container.innerHTML = '';
        result.instances.forEach(instance => {
            const card = createInstanceCard(instance);
            container.appendChild(card);
        });
        
        // Populate instance selectors
        populateInstanceSelectors(result.instances);
    } else {
        container.innerHTML = '<div class="no-data">Failed to load instances</div>';
    }
}

// Create instance card
function createInstanceCard(instance) {
    const card = document.createElement('div');
    card.className = 'instance-card';
    
    const statusClass = `status-${instance.status}`;
    const statusText = instance.status.charAt(0).toUpperCase() + instance.status.slice(1);
    
    card.innerHTML = `
        <div class="instance-header">
            <div class="instance-name">${escapeHtml(instance.instance_name)}</div>
            <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        ${instance.phone_number ? `<div><strong>Phone:</strong> ${escapeHtml(instance.phone_number)}</div>` : ''}
        <div><strong>AI:</strong> ${instance.ai_enabled ? '✓ Enabled' : '✗ Disabled'}</div>
        <div><strong>Auto Reply:</strong> ${instance.auto_reply ? '✓ On' : '✗ Off'}</div>
        <div class="instance-actions">
            ${instance.status === 'disconnected' ? 
                `<button class="btn btn-primary btn-sm" onclick="connectInstance(${instance.id})">Connect</button>` :
                `<button class="btn btn-danger btn-sm" onclick="disconnectInstance(${instance.id})">Disconnect</button>`
            }
            <button class="btn btn-secondary btn-sm" onclick="editInstance(${instance.id})">Settings</button>
            <button class="btn btn-danger btn-sm" onclick="deleteInstance(${instance.id})">Delete</button>
        </div>
    `;
    
    return card;
}

// Populate instance selectors
function populateInstanceSelectors(instances) {
    const selectors = ['instanceSelector', 'contactsInstanceSelector'];
    
    selectors.forEach(selectorId => {
        const select = document.getElementById(selectorId);
        if (select) {
            select.innerHTML = '<option value="">Select Instance</option>';
            instances.forEach(instance => {
                if (instance.status === 'connected') {
                    const option = document.createElement('option');
                    option.value = instance.id;
                    option.textContent = `${instance.instance_name} (${instance.phone_number || 'N/A'})`;
                    select.appendChild(option);
                }
            });
        }
    });
}

// Connect instance
async function connectInstance(instanceId) {
    const result = await apiRequest(`/whatsapp/instance/${instanceId}/connect`, 'POST');
    
    if (result && result.success) {
        showNotification('info', 'Connecting... QR code will appear shortly.');
        openModal('qrModal');
        document.getElementById('qrCodeContainer').innerHTML = '<div class="loading">Generating QR code...</div>';
    } else {
        showNotification('error', result?.message || 'Failed to connect');
    }
}

// Disconnect instance
async function disconnectInstance(instanceId) {
    if (!confirm('Are you sure you want to disconnect this instance?')) return;
    
    const result = await apiRequest(`/whatsapp/instance/${instanceId}/disconnect`, 'POST');
    
    if (result && result.success) {
        showNotification('success', 'Instance disconnected');
        loadInstances();
    } else {
        showNotification('error', result?.message || 'Failed to disconnect');
    }
}

// Delete instance
async function deleteInstance(instanceId) {
    if (!confirm('Are you sure you want to delete this instance? This action cannot be undone.')) return;
    
    const result = await apiRequest(`/whatsapp/instance/${instanceId}`, 'DELETE');
    
    if (result && result.success) {
        showNotification('success', 'Instance deleted');
        loadInstances();
    } else {
        showNotification('error', result?.message || 'Failed to delete instance');
    }
}

// Display QR Code
function displayQRCode(qrDataUrl) {
    const container = document.getElementById('qrCodeContainer');
    container.innerHTML = `<img src="${qrDataUrl}" alt="QR Code" style="max-width: 100%;">`;
}

// Load contacts
async function loadContacts(instanceId) {
    const container = document.getElementById('contactsList');
    container.innerHTML = '<div class="loading">Loading contacts...</div>';
    
    const result = await apiRequest(`/contacts?instanceId=${instanceId}`);
    
    if (result && result.success) {
        if (result.contacts.length === 0) {
            container.innerHTML = '<div class="no-data">No contacts yet</div>';
            return;
        }
        
        container.innerHTML = '';
        result.contacts.forEach(contact => {
            const item = createContactItem(contact);
            container.appendChild(item);
        });
    } else {
        container.innerHTML = '<div class="no-data">Failed to load contacts</div>';
    }
}

// Create contact item
function createContactItem(contact) {
    const item = document.createElement('div');
    item.className = 'contact-item';
    item.innerHTML = `
        <div><strong>${escapeHtml(contact.name || contact.push_name || contact.phone_number)}</strong></div>
        <div style="font-size: 14px; color: #666;">${escapeHtml(contact.phone_number)}</div>
    `;
    
    item.onclick = () => {
        currentContact = contact;
        document.querySelectorAll('.contact-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        loadMessages(currentInstance, contact.id);
    };
    
    return item;
}

// Load messages
async function loadMessages(instanceId, contactId) {
    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = '<div class="loading">Loading messages...</div>';
    
    const result = await apiRequest(`/messages?instanceId=${instanceId}&contactId=${contactId}`);
    
    if (result && result.success) {
        displayMessages(result.messages);
    } else {
        chatArea.innerHTML = '<div class="no-data">Failed to load messages</div>';
    }
}

// Display messages
function displayMessages(messages) {
    const chatArea = document.getElementById('chatArea');
    
    if (messages.length === 0) {
        chatArea.innerHTML = '<div class="no-data">No messages yet</div>';
        return;
    }
    
    const messagesHtml = messages.map(msg => {
        const direction = msg.direction === 'incoming' ? 'message-incoming' : 'message-outgoing';
        const aiClass = msg.is_ai_response ? ' message-ai' : '';
        
        return `
            <div class="message ${direction}${aiClass}">
                <div>${escapeHtml(msg.content)}</div>
                <div style="font-size: 12px; opacity: 0.7; margin-top: 5px;">
                    ${new Date(msg.timestamp).toLocaleString()}
                    ${msg.is_ai_response ? ' (AI)' : ''}
                </div>
            </div>
        `;
    }).join('');
    
    chatArea.innerHTML = `
        <div class="chat-messages">${messagesHtml}</div>
        <div style="padding: 15px; border-top: 1px solid var(--border-color);">
            <button class="btn btn-primary" onclick="openSendMessage()">Send Message</button>
        </div>
    `;
    
    // Scroll to bottom
    const messagesDiv = chatArea.querySelector('.chat-messages');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Handle new message from socket
function handleNewMessage(data) {
    if (currentInstance === data.instanceId && currentContact && currentContact.phone_number === data.message.from) {
        // Reload messages if viewing this contact
        loadMessages(data.instanceId, currentContact.id);
    }
    
    showNotification('info', `New message from ${data.message.name}`);
}

// Open send message modal
function openSendMessage() {
    if (!currentContact) return;
    
    document.getElementById('send_instance_id').value = currentInstance;
    document.getElementById('send_phone').value = currentContact.phone_number;
    openModal('sendMessageModal');
}

// Load AI settings
async function loadAISettings() {
    const result = await apiRequest('/ai/settings');
    
    if (result && result.success) {
        const settings = result.settings;
        document.getElementById('api_provider').value = settings.api_provider || 'openai';
        document.getElementById('model').value = settings.model || '';
        document.getElementById('temperature').value = settings.temperature || 0.7;
        document.getElementById('max_tokens').value = settings.max_tokens || 500;
        document.getElementById('system_prompt').value = settings.system_prompt || '';
        document.getElementById('custom_instructions').value = settings.custom_instructions || '';
        
        if (!settings.has_api_key) {
            document.getElementById('api_key').placeholder = 'No API key configured';
        } else {
            document.getElementById('api_key').placeholder = '••••••••••••••••';
        }
    }
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize socket
    initSocket();
    
    // Load instances
    loadInstances();
    
    // Load AI settings
    loadAISettings();
    
    // Sidebar navigation
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            
            document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
            document.getElementById(`${section}-section`).classList.add('active');
        });
    });
    
    // Add instance button
    document.getElementById('addInstanceBtn').addEventListener('click', () => {
        openModal('addInstanceModal');
    });
    
    // Add instance form
    document.getElementById('addInstanceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            instance_name: formData.get('instance_name'),
            ai_enabled: document.getElementById('ai_enabled').checked,
            auto_reply: document.getElementById('auto_reply').checked
        };
        
        const result = await apiRequest('/whatsapp/instance', 'POST', data);
        
        if (result && result.success) {
            showNotification('success', 'Instance created successfully');
            closeModal('addInstanceModal');
            e.target.reset();
            loadInstances();
        } else {
            showNotification('error', result?.message || 'Failed to create instance');
        }
    });
    
    // Instance selector change
    document.getElementById('instanceSelector').addEventListener('change', (e) => {
        currentInstance = parseInt(e.target.value);
        if (currentInstance) {
            loadContacts(currentInstance);
        }
    });
    
    // AI settings form
    document.getElementById('aiSettingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            api_provider: formData.get('api_provider'),
            api_key: formData.get('api_key') || undefined,
            model: formData.get('model'),
            temperature: parseFloat(formData.get('temperature')),
            max_tokens: parseInt(formData.get('max_tokens')),
            system_prompt: formData.get('system_prompt'),
            custom_instructions: formData.get('custom_instructions')
        };
        
        const result = await apiRequest('/ai/settings', 'PUT', data);
        
        if (result && result.success) {
            showNotification('success', 'AI settings saved successfully');
        } else {
            showNotification('error', result?.message || 'Failed to save settings');
        }
    });
    
    // Test AI button
    document.getElementById('testAIBtn').addEventListener('click', async () => {
        const message = prompt('Enter a test message:');
        if (!message) return;
        
        const result = await apiRequest('/ai/test', 'POST', { message });
        
        if (result && result.success) {
            alert(`AI Response:\n\n${result.response}`);
        } else {
            showNotification('error', result?.message || 'Failed to test AI');
        }
    });
    
    // Send message form
    document.getElementById('sendMessageForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const instanceId = formData.get('instance_id');
        const phone = formData.get('phone');
        const message = formData.get('message');
        
        const result = await apiRequest(`/whatsapp/instance/${instanceId}/send`, 'POST', {
            phone: phone,
            message: message
        });
        
        if (result && result.success) {
            showNotification('success', 'Message sent successfully');
            closeModal('sendMessageModal');
            e.target.reset();
            
            // Reload messages
            if (currentContact) {
                loadMessages(currentInstance, currentContact.id);
            }
        } else {
            showNotification('error', result?.message || 'Failed to send message');
        }
    });
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });
    
    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
});
