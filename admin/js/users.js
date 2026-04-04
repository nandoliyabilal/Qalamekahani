document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    const tableBody = document.getElementById('userTableBody');
    const searchInput = document.getElementById('searchInput');

    // Stats Elements
    const totalEl = document.getElementById('totalUsersCount');
    const activeEl = document.getElementById('activeTodayCount');
    const newEl = document.getElementById('newUsersCount');

    let allUsers = [];

    // Fetch Users
    async function fetchUsers() {
        try {
            const res = await fetchWithAuth('/auth/users');

            if (!res.ok) throw new Error('Failed to fetch users');

            allUsers = await res.json();
            renderUsers(allUsers);
            updateStats(allUsers);

        } catch (err) {
            console.error(err);
            if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Error loading users. ${err.message}</td></tr>`;
        }
    }

    fetchUsers();

    // Search Logic
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allUsers.filter(u =>
                (u.name || '').toLowerCase().includes(term) ||
                (u.email || '').toLowerCase().includes(term)
            );
            renderUsers(filtered);
        });
    }

    function renderUsers(users) {
        if (!tableBody) return;
        if (users.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No users found.</td></tr>`;
            return;
        }

        tableBody.innerHTML = users.map(user => {
            const joinedDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown';
            const lastLogin = user.last_login ? new Date(user.last_login).toLocaleString() : 'Never';
            
            const isBlocked = user.is_blocked;
            const statusClass = isBlocked
                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                : (user.is_verified ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20');
            const statusText = isBlocked ? 'BLOCKED' : (user.is_verified ? 'VERIFIED' : 'PENDING');

            const blockBtn = `
                <button onclick="toggleBlock('${user.id}', ${!isBlocked})" 
                    class="p-2 rounded-lg transition-colors ${isBlocked ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-red-400 hover:bg-red-400/10'}"
                    title="${isBlocked ? 'Unblock User' : 'Block User'}">
                    <i data-lucide="${isBlocked ? 'user-check' : 'user-x'}" class="w-4.5 h-4.5"></i>
                </button>`;

            return `
            <tr class="hover:bg-gray-700/30 transition-colors">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <img class="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random" alt="">
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-white">${user.name || 'Unknown'}</div>
                            <div class="text-sm text-gray-500">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 inline-flex text-[10px] leading-5 font-bold uppercase tracking-wider rounded-full ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-400">
                    ${joinedDate}
                </td>
                <td class="px-6 py-4 text-sm text-gray-400">
                    ${lastLogin}
                </td>
                <td class="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button onclick="viewUser('${user.id}')" class="p-2 text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors" title="View Details">
                        <i data-lucide="eye" class="w-4.5 h-4.5"></i>
                    </button>
                    ${blockBtn}
                </td>
            </tr>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();
    }

    function updateStats(users) {
        if (totalEl) totalEl.textContent = users.length;

        const today = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        const oneWeek = 7 * oneDay;

        // Active Today (Login < 24h ago)
        const activeCount = users.filter(u => {
            if (!u.last_login) return false;
            const loginDate = new Date(u.last_login);
            return (today - loginDate) < oneDay;
        }).length;
        if (activeEl) activeEl.textContent = activeCount;

        // New This Week
        const newCount = users.filter(u => {
            if (!u.created_at) return false;
            const joinDate = new Date(u.created_at);
            return (today - joinDate) < oneWeek;
        }).length;
        if (newEl) newEl.textContent = newCount;
    }

    // Expose View Function globally
    window.viewUser = (id) => {
        const user = allUsers.find(u => u.id === id);
        if (!user) return;

        // Populate Modal
        document.getElementById('modalUserName').textContent = user.name || 'Unknown';
        document.getElementById('modalUserEmail').textContent = user.email;
        
        const isBlocked = user.is_blocked;
        document.getElementById('modalUserJoined').textContent = user.created_at ? new Date(user.created_at).toDateString() : 'Unknown';
        document.getElementById('modalUserLastLogin').textContent = user.last_login ? new Date(user.last_login).toLocaleString() : 'Never';
        document.getElementById('modalUserStatus').textContent = isBlocked ? 'BLOCKED' : (user.is_verified ? 'VERIFIED' : 'PENDING');
        document.getElementById('modalUserStatus').className = `inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isBlocked ? 'bg-red-500/10 text-red-500' : (user.is_verified ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500')}`;
        document.getElementById('modalUserRole').textContent = user.role;
        document.getElementById('modalUserAvatar').textContent = (user.name || 'U').charAt(0).toUpperCase();

        // Access Control
        const blockCtrl = document.getElementById('blockControl');
        if (blockCtrl) {
            blockCtrl.innerHTML = `
                <button onclick="toggleBlock('${user.id}', ${!isBlocked})" 
                    class="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${isBlocked ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/50'}">
                    <i data-lucide="${isBlocked ? 'unlock' : 'lock'}" class="w-4 h-4"></i>
                    ${isBlocked ? 'Unblock User' : 'Block User'}
                </button>
            `;
        }

        // Social Stats
        document.getElementById('modalLikedCount').textContent = user.liked_stories ? user.liked_stories.length : 0;
        document.getElementById('modalSavedCount').textContent = user.saved_blogs ? user.saved_blogs.length : 0;
        document.getElementById('modalAudioCount').textContent = (user.saved_audios || user.listened_audios) ? (user.saved_audios || user.listened_audios).length : 0;

        // Show Modal
        const modal = document.getElementById('userModal');
        modal.classList.remove('hidden');
        setTimeout(() => {
            const content = document.getElementById('userModalContent');
            if (content) {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
            }
        }, 10);

        if (window.lucide) lucide.createIcons();
    };

    window.toggleBlock = async (id, blockStatus) => {
        const action = blockStatus ? 'block' : 'unblock';
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        try {
            const res = await fetchWithAuth(`/auth/users/${id}/block`, {
                method: 'PUT',
                body: JSON.stringify({ block: blockStatus })
            });

            if (res.ok) {
                location.reload();
            } else {
                const errData = await res.json();
                alert(errData.message || 'Failed to update status.');
            }
        } catch (err) {
            console.error('[BLOCK] Error:', err);
            alert('Error updating status. Check console.');
        }
    };

    window.closeUserModal = () => {
        const modal = document.getElementById('userModal');
        const content = document.getElementById('userModalContent');
        if (content) {
            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-95', 'opacity-0');
        }
        setTimeout(() => {
            if (modal) modal.classList.add('hidden');
        }, 300);
    };
});
