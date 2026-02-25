document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    const tableBody = document.getElementById('userTableBody');
    const searchInput = document.getElementById('searchInput'); // Optional search

    // Stats Elements
    const totalEl = document.getElementById('totalUsersCount');
    const activeEl = document.getElementById('activeTodayCount');
    const newEl = document.getElementById('newUsersCount');
    const verifiedEl = document.getElementById('verifiedUsersCount');

    let allUsers = [];

    // Fetch Users
    try {
        const res = await fetch('/api/auth/users', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error('Failed to fetch users');

        allUsers = await res.json();
        renderUsers(allUsers);
        updateStats(allUsers);

    } catch (err) {
        console.error(err);
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Error loading users. ${err.message}</td></tr>`;
    }

    // Search Logic
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allUsers.filter(u =>
                u.name.toLowerCase().includes(term) ||
                u.email.toLowerCase().includes(term)
            );
            renderUsers(filtered);
        });
    }

    function renderUsers(users) {
        if (users.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No users found.</td></tr>`;
            return;
        }

        tableBody.innerHTML = users.map(user => {
            const joinedDate = new Date(user.createdAt).toLocaleDateString();
            const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never';
            const statusClass = user.isVerified
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800';
            const statusText = user.isVerified ? 'Verified' : 'Pending';

            return `
            <tr class="hover:bg-gray-700/30 transition-colors">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                            <img class="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random" alt="">
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-white">${user.name}</div>
                            <div class="text-sm text-gray-500">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-400">
                    ${joinedDate}
                </td>
                <td class="px-6 py-4 text-sm text-gray-400">
                    ${lastLogin}
                </td>
                <td class="px-6 py-4 text-right text-sm font-medium">
                    <button onclick="viewUser('${user._id}')" class="text-indigo-400 hover:text-indigo-300 mr-3">View Details</button>
                </td>
            </tr>
            `;
        }).join('');
    }

    function updateStats(users) {
        totalEl.textContent = users.length;

        // Active Today (Login < 24h ago)
        const today = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        const activeCount = users.filter(u => {
            if (!u.lastLogin) return false;
            const loginDate = new Date(u.lastLogin);
            return (today - loginDate) < oneDay;
        }).length;
        activeEl.textContent = activeCount;

        // New This Week
        const oneWeek = 7 * oneDay;
        const newCount = users.filter(u => {
            const joinDate = new Date(u.createdAt);
            return (today - joinDate) < oneWeek;
        }).length;
        newEl.textContent = newCount;

        // Verified
        const verifiedCount = users.filter(u => u.isVerified).length;
        verifiedEl.textContent = verifiedCount;
    }

    // Expose View Function globally
    window.viewUser = (id) => {
        const user = allUsers.find(u => u._id === id);
        if (!user) return;

        // Populate Modal
        document.getElementById('modalUserName').textContent = user.name;
        document.getElementById('modalUserEmail').textContent = user.email;
        document.getElementById('modalUserJoined').textContent = new Date(user.createdAt).toDateString();
        document.getElementById('modalUserLastLogin').textContent = user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never';
        document.getElementById('modalUserStatus').textContent = user.isVerified ? 'Verified' : 'Pending';
        document.getElementById('modalUserStatus').className = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`;
        document.getElementById('modalUserRole').textContent = user.role;
        document.getElementById('modalUserAvatar').textContent = user.name.charAt(0).toUpperCase();

        // Optional stats if user obj has them (it should from getAllUsers if populated or sent)
        // Note: getAllUsers in controller sends lean user objects.
        // It saves likedStories as array of IDs. So length is count.
        document.getElementById('modalLikedCount').textContent = user.likedStories ? user.likedStories.length : 0;
        document.getElementById('modalSavedCount').textContent = user.savedBlogs ? user.savedBlogs.length : 0;
        document.getElementById('modalAudioCount').textContent = user.listenedAudios ? user.listenedAudios.length : 0;

        // Show Modal
        const modal = document.getElementById('userModal');
        modal.classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('userModalContent').classList.remove('scale-95', 'opacity-0');
            document.getElementById('userModalContent').classList.add('scale-100', 'opacity-100');
        }, 10);
    };

    window.closeUserModal = () => {
        const modal = document.getElementById('userModal');
        document.getElementById('userModalContent').classList.remove('scale-100', 'opacity-100');
        document.getElementById('userModalContent').classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    };
});
