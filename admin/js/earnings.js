document.addEventListener('DOMContentLoaded', () => {
    fetchEarnings();

    // Set Admin Name
    const user = JSON.parse(localStorage.getItem('adminUser'));
    if (user && user.name) {
        document.getElementById('adminName').textContent = user.name;
    }
});

async function fetchEarnings() {
    const tableBody = document.getElementById('earningsTableBody');
    const totalEarningsSum = document.getElementById('totalEarningsSum');

    try {
        const response = await fetchWithAuth('/admin/earnings');

        if (!response.ok) throw new Error('Failed to fetch earnings data');

        const data = await response.json();

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500">No premium sales recorded yet.</td></tr>';
            return;
        }

        // Render Table Rows
        tableBody.innerHTML = data.map(item => `
            <tr class="hover:bg-gray-700/50 transition-colors">
                <td class="px-6 py-4">
                    <div class="font-medium text-white">${item.title}</div>
                    <div class="text-xs text-gray-500">ID: ${item.id}</div>
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${getTypeStyles(item.type)} font-bold">
                        ${item.type}
                    </span>
                </td>
                <td class="px-6 py-4 font-medium">${item.salesCount} Sales</td>
                <td class="px-6 py-4">
                    <div class="text-green-400 font-bold text-lg">₹${item.totalEarned.toLocaleString()}</div>
                </td>
            </tr>
        `).join('');

        // Calculate Total
        const grandTotal = data.reduce((sum, item) => sum + item.totalEarned, 0);
        totalEarningsSum.innerHTML = `
            <div class="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-6 rounded-xl border border-green-500/20">
                <div class="flex items-center gap-4">
                    <div class="p-3 bg-green-500/20 rounded-lg text-green-400">
                        <i data-lucide="wallet" class="w-8 h-8"></i>
                    </div>
                    <div>
                        <p class="text-green-400/80 text-sm font-medium">Total Platform Revenue</p>
                        <h2 class="text-4xl font-bold text-white">₹${grandTotal.toLocaleString()}</h2>
                    </div>
                </div>
            </div>
        `;

        lucide.createIcons();

    } catch (error) {
        console.error('Error fetching earnings:', error);
        tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-red-500">Error: ${error.message}</td></tr>`;
    }
}

function getTypeStyles(type) {
    switch (type) {
        case 'Story': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
        case 'Audio': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
        case 'Book': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
        default: return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
}
