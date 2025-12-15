// API Configuration
const API_URL = 'http://localhost:5000/api';

// Global state
let links = [];
let editingId = null;
let authToken = localStorage.getItem('authToken');
let currentUser = null;
let GOOGLE_CLIENT_ID = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    checkAuth();
    attachAuthListeners();
    if (GOOGLE_CLIENT_ID) {
        initializeGoogleSignIn();
    }
});

// Load configuration from backend
async function loadConfig() {
    try {
        const response = await fetch(`${API_URL}/config`);
        if (response.ok) {
            const data = await response.json();
            GOOGLE_CLIENT_ID = data.googleClientId;
        }
    } catch (error) {
        console.error('Failed to load config:', error);
    }
}

// Check authentication
function checkAuth() {
    if (authToken) {
        validateToken();
    } else {
        showAuthModal();
    }
}

// Validate token
async function validateToken() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            showMainApp();
        } else {
            logout();
        }
    } catch (error) {
        console.error('Token validation error:', error);
        logout();
    }
}

// Show authentication modal
function showAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
    
    // Initialize Google Sign-In when modal is shown
    if (GOOGLE_CLIENT_ID) {
        setTimeout(() => initializeGoogleSignIn(), 100);
    }
}

// Show main app
function showMainApp() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('username').textContent = currentUser.username;
    loadLinks();
    attachEventListeners();
}

// Initialize Google Sign-In
function initializeGoogleSignIn() {
    if (typeof google !== 'undefined' && GOOGLE_CLIENT_ID) {
        // Clear existing buttons
        document.getElementById('googleLoginButton').innerHTML = '';
        document.getElementById('googleRegisterButton').innerHTML = '';
        
        // Initialize for login
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn
        });
        
        // Render login button
        google.accounts.id.renderButton(
            document.getElementById('googleLoginButton'),
            { 
                theme: 'filled_black', 
                size: 'large',
                width: '100%',
                text: 'signin_with',
                shape: 'rectangular'
            }
        );
        
        // Render register button
        google.accounts.id.renderButton(
            document.getElementById('googleRegisterButton'),
            { 
                theme: 'filled_black', 
                size: 'large',
                width: '100%',
                text: 'signup_with',
                shape: 'rectangular'
            }
        );
    } else if (!GOOGLE_CLIENT_ID) {
        console.log('Google Client ID not loaded yet');
    }
}

// Handle Google Sign-In
async function handleGoogleSignIn(response) {
    try {
        const res = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ credential: response.credential })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            showAuthMessage('Google sign-in successful!', 'success');
            setTimeout(() => showMainApp(), 500);
        } else {
            showAuthMessage(data.message || 'Google sign-in failed', 'error');
        }
    } catch (error) {
        console.error('Google sign-in error:', error);
        showAuthMessage('Network error. Please try again.', 'error');
    }
}

// Auth event listeners
function attachAuthListeners() {
    // Tab switching
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            const tabName = e.target.dataset.tab;
            document.getElementById('loginForm').style.display = tabName === 'login' ? 'block' : 'none';
            document.getElementById('registerForm').style.display = tabName === 'register' ? 'block' : 'none';
            document.getElementById('authMessage').textContent = '';
            
            // Re-render Google buttons for the active tab
            if (GOOGLE_CLIENT_ID) {
                setTimeout(() => initializeGoogleSignIn(), 100);
            }
        });
    });
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            showAuthMessage('Login successful!', 'success');
            setTimeout(() => showMainApp(), 500);
        } else {
            showAuthMessage(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAuthMessage('Network error. Please try again.', 'error');
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    
    if (password.length < 6) {
        showAuthMessage('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            showAuthMessage('Registration successful!', 'success');
            setTimeout(() => showMainApp(), 500);
        } else {
            showAuthMessage(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAuthMessage('Network error. Please try again.', 'error');
    }
}

// Show auth message
function showAuthMessage(message, type) {
    const msgEl = document.getElementById('authMessage');
    msgEl.textContent = message;
    msgEl.className = `auth-message ${type}`;
}

// Logout
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    links = [];
    showAuthModal();
}

// Main app event listeners
function attachEventListeners() {
    document.getElementById('linkForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.getElementById('categoryFilter').addEventListener('change', handleSearch);
    document.getElementById('sortBy').addEventListener('change', handleSearch);
    document.getElementById('exportBtn').addEventListener('click', exportLinks);
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// Load links from API
async function loadLinks() {
    try {
        const searchTerm = document.getElementById('searchInput').value;
        const category = document.getElementById('categoryFilter').value;
        const sortBy = document.getElementById('sortBy').value;
        
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (category) params.append('category', category);
        if (sortBy) params.append('sortBy', sortBy);
        
        const response = await fetch(`${API_URL}/links?${params}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load links');
        
        const data = await response.json();
        links = data.links;
        renderLinks();
        updateStats();
        loadCategories();
    } catch (error) {
        console.error('Load links error:', error);
        showNotification('Failed to load links', 'error');
    }
}

// Load categories from API
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/links/categories/list`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load categories');
        
        const data = await response.json();
        populateCategoryFilter(data.categories);
    } catch (error) {
        console.error('Load categories error:', error);
    }
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const url = document.getElementById('linkUrl').value.trim();
    const title = document.getElementById('linkTitle').value.trim();
    const description = document.getElementById('linkDescription').value.trim();
    const category = document.getElementById('linkCategory').value.trim();
    
    if (!url || !title) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        const method = editingId !== null ? 'PUT' : 'POST';
        const endpoint = editingId !== null ? `${API_URL}/links/${editingId}` : `${API_URL}/links`;
        
        const response = await fetch(endpoint, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ url, title, description, category })
        });
        
        if (!response.ok) throw new Error('Failed to save link');
        
        const data = await response.json();
        showNotification(data.message, 'success');
        
        editingId = null;
        document.getElementById('submitText').textContent = 'Add Link';
        document.getElementById('linkForm').reset();
        
        loadLinks();
    } catch (error) {
        console.error('Save link error:', error);
        showNotification('Failed to save link', 'error');
    }
}

// Render all links
function renderLinks() {
    const container = document.getElementById('linksContainer');
    
    if (links.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>📭 No links found. Start by adding your first link above!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = links.map(link => createLinkCard(link)).join('');
}

// Create a link card HTML
function createLinkCard(link) {
    const date = new Date(link.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    return `
        <div class="link-card" data-id="${link.id}">
            <div class="link-header">
                <div class="link-info">
                    <div class="link-title">${escapeHtml(link.title)}</div>
                    <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="link-url">
                        ${escapeHtml(link.url)}
                    </a>
                    ${link.description ? `<div class="link-description">${escapeHtml(link.description)}</div>` : ''}
                </div>
            </div>
            <div class="link-meta">
                ${link.category ? `<span class="link-category">${escapeHtml(link.category)}</span>` : ''}
                <span class="link-date">Added: ${date}</span>
            </div>
            <div class="link-actions">
                <button class="action-btn visit-btn" onclick="visitLink('${escapeHtml(link.url)}')">
                    Visit
                </button>
                <button class="action-btn edit-btn" onclick="editLink(${link.id})">
                    Edit
                </button>
                <button class="action-btn delete-btn" onclick="deleteLink(${link.id})">
                    Delete
                </button>
            </div>
        </div>
    `;
}

// Visit link
function visitLink(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
}

// Edit link
function editLink(id) {
    const link = links.find(l => l.id === id);
    if (!link) return;
    
    document.getElementById('linkUrl').value = link.url;
    document.getElementById('linkTitle').value = link.title;
    document.getElementById('linkDescription').value = link.description || '';
    document.getElementById('linkCategory').value = link.category || '';
    
    editingId = id;
    document.getElementById('submitText').textContent = 'Update Link';
    
    document.querySelector('.add-link-section').scrollIntoView({ behavior: 'smooth' });
}

// Delete link
async function deleteLink(id) {
    if (!confirm('Are you sure you want to delete this link?')) return;
    
    try {
        const response = await fetch(`${API_URL}/links/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to delete link');
        
        const data = await response.json();
        showNotification(data.message, 'success');
        loadLinks();
    } catch (error) {
        console.error('Delete link error:', error);
        showNotification('Failed to delete link', 'error');
    }
}

// Handle search and filter
function handleSearch() {
    loadLinks();
}

// Update stats
function updateStats() {
    const count = links.length;
    document.getElementById('linkCount').textContent = `${count} link${count !== 1 ? 's' : ''} saved`;
}

// Populate category filter dropdown
function populateCategoryFilter(categories) {
    const select = document.getElementById('categoryFilter');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">All Categories</option>' +
        categories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('');
    
    select.value = currentValue;
}

// Export links to JSON
function exportLinks() {
    if (links.length === 0) {
        showNotification('No links to export!', 'error');
        return;
    }
    
    const dataStr = JSON.stringify(links, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `linknote-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Links exported successfully!', 'success');
}

// Show notification
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
