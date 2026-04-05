document.addEventListener('DOMContentLoaded', () => {
    fetchOrders();
    const user = JSON.parse(localStorage.getItem('adminUser'));
    if (user && user.name) document.getElementById('adminName').textContent = user.name;
});

async function fetchOrders() {
    const tableBody = document.getElementById('orderTableBody');
    try {
        const response = await fetchWithAuth('/orders'); // Uses admin wrapper
        if (!response.ok) throw new Error('Failed to fetch orders');
        const orders = await response.json();
        renderTable(orders);
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-400">Error loading orders: ${error.message}</td></tr>`;
    }
}

function renderTable(orders) {
    const tableBody = document.getElementById('orderTableBody');

    if (orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No orders found yet.</td></tr>`;
        return;
    }

    tableBody.innerHTML = orders.map(order => `
        <tr class="hover:bg-gray-700/30 transition-colors">
            <td class="px-6 py-4 font-mono text-xs text-gray-500">#${(order.id || '').toString().slice(0, 8)}</td>
            <td class="px-6 py-4 font-medium text-white">${order.book_title || 'Unknown Book'}</td>
            <td class="px-6 py-4 text-green-400 font-bold">₹${order.amount}</td>
            <td class="px-6 py-4 font-mono text-xs">${order.transaction_id || '-'}</td>
            <td class="px-6 py-4 text-xs">${new Date(order.created_at).toLocaleDateString()}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs rounded-full ${order.status === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-500'} uppercase font-bold">${order.status || 'CREATED'}</span>
            </td>
        </tr>
    `).join('');

    lucide.createIcons();
}
