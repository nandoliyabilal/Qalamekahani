const API_URL = '/api';

// Admin Toast System
window.showToast = function (message, type = 'success') {
    let container = document.getElementById('admin-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'admin-toast-container';
        container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgColor = type === 'error' ? '#ef4444' : (type === 'warning' ? '#f59e0b' : '#10b981');
    toast.style.cssText = `background: ${bgColor}; color: white; padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: sans-serif; opacity: 0; transform: translateY(20px); transition: all 0.3s ease;`;
    toast.textContent = message;

    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    // Remove
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// Override native alert globally for admin
window.alert = function (message) {
    const msgLower = String(message).toLowerCase();
    const type = (msgLower.includes('error') || msgLower.includes('fail') || msgLower.includes('missing')) ? 'error' : 'success';
    window.showToast(message, type);
};

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

// Highlight active link in sidebar
function highlightActiveLink() {
    const path = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Default active class styles (Indigo)
    const activeClasses = ['bg-indigo-600', 'text-white', 'shadow-lg', 'shadow-indigo-500/20'];
    const inactiveClasses = ['text-gray-400', 'hover:bg-gray-700', 'hover:text-white'];

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Check if the current path contains the link href (e.g. dashboard.html)
        if (path.includes(href) || (path.endsWith('/admin/') && href === 'dashboard.html')) {
            link.classList.add(...activeClasses);
            link.classList.remove(...inactiveClasses);
        } else {
            link.classList.remove(...activeClasses);
            link.classList.add(...inactiveClasses);
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    highlightActiveLink();
});
