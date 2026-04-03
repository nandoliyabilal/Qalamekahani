document.addEventListener('DOMContentLoaded', () => {
    fetchStats();

    // Set Admin Name
    const user = JSON.parse(localStorage.getItem('adminUser'));
    if (user && user.name) {
        document.getElementById('adminName').textContent = user.name;
    }
});

async function fetchStats() {
    const statsGrid = document.getElementById('statsGrid');

    try {
        // Note: fetchWithAuth appends API_URL, so path is /admin/stats
        const response = await fetchWithAuth('/admin/stats');

        if (!response.ok) throw new Error('Failed to fetch stats');

        const data = await response.json();

        // Map data correctly
        const users = data.users?.total || 0;
        const activeUsers = data.users?.active || 0;
        const stories = data.content?.stories || 0;
        const books = data.content?.books || 0;
        const audio = data.content?.audio || 0;
        const blogs = data.content?.blogs || 0;
        const reviews = data.content?.reviews || 0;
        const totalViews = data.content?.totalViews || 0;
        const totalDownloads = data.content?.totalDownloads || 0;

        // Render detailed stats
        statsGrid.innerHTML = `
                ${createStatCard('Total Users', users, 'users', 'blue')}
                ${createStatCard('Total Views', totalViews, 'eye', 'green')}
                ${createStatCard('Published Stories', stories, 'book-open', 'purple')}
                ${createStatCard('Published Books', books, 'library', 'indigo')}
                ${createStatCard('Audio Stories', audio, 'headphones', 'amber')}
                ${createStatCard('Blogs', blogs, 'file-text', 'pink')}
                ${createStatCard('Reviews', reviews, 'star', 'yellow')}
                ${createStatCard('Image Downloads', totalDownloads, 'download', 'cyan')}
            `;

        // Render Recent Users (if container exists, or create it)
        // Ideally should be in dashboard.html but we can inject here for now or update HTML
        // We'll just focus on stats grid for now to be safe.

        lucide.createIcons();

        // New: Render Charts
        renderCharts(data);

    } catch (error) {
        console.error('Error fetching stats:', error);
        statsGrid.innerHTML = `
                <div class="col-span-full bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg">
                    Failed to load dashboard statistics. ${error.message}
                </div>
            `;
    }
}

function createStatCard(title, value, icon, color) {
    const colors = {
        blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
        green: 'text-green-400 bg-green-400/10 border-green-400/20',
        purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
        indigo: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
        amber: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
        pink: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
        yellow: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
        cyan: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
    };
    const theme = colors[color] || colors.blue;

    return `
            <div class="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 transform hover:-translate-y-1">
                <div class="flex items-center justify-between mb-4">
                    <div class="p-3 rounded-lg ${theme}">
                        <i data-lucide="${icon}" class="w-6 h-6"></i>
                    </div>
                </div>
                <h3 class="text-3xl font-bold text-white mb-1">${value}</h3>
                <p class="text-gray-400 text-sm font-medium">${title}</p>
            </div>
        `;
}

function renderCharts(data) {
    const contentCtx = document.getElementById('contentChart').getContext('2d');
    const userCtx = document.getElementById('userChart').getContext('2d');

    // Content Overview Chart (Bar)
    new Chart(contentCtx, {
        type: 'bar',
        data: {
            labels: ['Stories', 'Books', 'Audio', 'Blogs', 'Reviews'],
            datasets: [{
                label: 'Total Count',
                data: [
                    data.content?.stories || 0,
                    data.content?.books || 0,
                    data.content?.audio || 0,
                    data.content?.blogs || 0,
                    data.content?.reviews || 0
                ],
                backgroundColor: [
                    'rgba(168, 85, 247, 0.7)', // Purple
                    'rgba(99, 102, 241, 0.7)', // Indigo
                    'rgba(245, 158, 11, 0.7)', // Amber
                    'rgba(236, 72, 153, 0.7)', // Pink
                    'rgba(234, 179, 8, 0.7)'   // Yellow
                ],
                borderColor: [
                    'rgba(168, 85, 247, 1)',
                    'rgba(99, 102, 241, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(236, 72, 153, 1)',
                    'rgba(234, 179, 8, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#9ca3af'
                    }
                }
            }
        }
    });

    // User Activity Chart (Doughnut)
    const totalUsers = data.users?.total || 0;
    const activeUsers = data.users?.active || 0;
    const inactiveUsers = Math.max(0, totalUsers - activeUsers);

    new Chart(userCtx, {
        type: 'doughnut',
        data: {
            labels: ['Active Users (24h)', 'Inactive Users'],
            datasets: [{
                data: [activeUsers, inactiveUsers],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.7)', // Green
                    'rgba(59, 130, 246, 0.7)' // Blue
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(59, 130, 246, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#9ca3af'
                    }
                }
            }
        }
    });
}
