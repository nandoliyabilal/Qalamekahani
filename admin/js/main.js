const API_URL = '/api';

// Check Auth on page load
// Check Auth on page load
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    const path = window.location.pathname;

    // Detect if we are on the login page (index.html or root /admin/)
    const isLoginPage = path.endsWith('/admin/') || path.endsWith('/admin') || path.includes('index.html');

    if (!token) {
        // If not authenticated and NOT on login page, redirect to login
        if (!isLoginPage) {
            window.location.href = 'index.html';
        }
        // If on login page, stay there (do nothing)
    } else {
        // If authenticated and ON login page, redirect to dashboard
        if (isLoginPage) {
            window.location.href = 'dashboard.html';
        }
        // If on other pages, stay there
    }
}

// Logout function
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'index.html';
}

// Fetch helper with Auth Header
async function fetchWithAuth(endpoint, options = {}) {
    const token = localStorage.getItem('adminToken');
    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    // Only set Content-Type to JSON if body is NOT FormData
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (response.status === 401) {
        logout(); // Token expired or invalid
    }

    return response;
}

// Sidebar Toggle (Mobile)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Add Sidebar HTML dynamically if it doesn't exist (except login page)
    if (!window.location.pathname.includes('index.html') && !document.getElementById('sidebar')) {
        // We might want to inject sidebar here or just rely on hardcoded HTML
    }
});
