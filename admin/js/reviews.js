document.addEventListener('DOMContentLoaded', () => {
    fetchReviews();
    const user = JSON.parse(localStorage.getItem('adminUser'));
    if (user && user.name) document.getElementById('adminName').textContent = user.name;
});

let reviews = [];

async function fetchReviews() {
    const tableBody = document.getElementById('reviewTableBody');
    try {
        const response = await fetchWithAuth('/reviews');
        if (!response.ok) throw new Error('Failed to fetch reviews');
        reviews = await response.json();
        renderTable();
    } catch (e) {
        console.error(e);
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-400">Error loading reviews</td></tr>`;
    }
}

function renderTable() {
    const tableBody = document.getElementById('reviewTableBody');
    if (reviews.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No reviews found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = reviews.map(review => `
        <tr class="hover:bg-gray-700/30 transition-colors">
            <td class="px-6 py-4">
                <div class="font-medium text-white">${review.user_name || review.user?.name || 'Unknown User'}</div>
                <div class="text-xs text-gray-500">${review.user_email || review.user?.email || 'No Email'}</div>
            </td>
            <td class="px-6 py-4 max-w-xs truncate" title="${review.comment}">${review.comment}</td>
            <td class="px-6 py-4 text-amber-400 font-bold">${review.rating} / 5</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs rounded-full ${review.status === 'approved' || review.isApproved ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}">
                    ${review.status === 'approved' || review.isApproved ? 'Approved' : 'Pending'}
                </span>
            </td>
            <td class="px-6 py-4 text-right flex justify-end gap-2">
                ${review.status !== 'approved' && !review.isApproved ? `
                <button onclick="updateStatus('${review._id}', true)" class="p-1 px-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs">Approve</button>
                ` : ''}
                <button onclick="deleteReview('${review._id}')" class="text-gray-400 hover:text-red-400 transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

async function updateStatus(id, isApproved) {
    try {
        const response = await fetchWithAuth(`/reviews/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: isApproved ? 'approved' : 'rejected' })
        });
        if (response.ok) {
            // alert('Review status updated!'); // Optional: too noisy
            fetchReviews();
        } else {
            const err = await response.json();
            alert('Failed to update: ' + (err.message || response.statusText));
        }
    } catch (e) {
        console.error(e);
        alert('Error: ' + e.message);
    }
}

async function deleteReview(id) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
        const response = await fetchWithAuth(`/reviews/${id}`, { method: 'DELETE' });
        if (response.ok) {
            alert('Review deleted successfully');
            fetchReviews();
        } else {
            const err = await response.json();
            alert('Failed to delete: ' + (err.message || response.statusText));
        }
    } catch (e) {
        console.error(e);
        alert('Error: ' + e.message);
    }
}
