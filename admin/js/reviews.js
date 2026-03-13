
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
    if (!tableBody) return;

    if (reviews.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No reviews found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = reviews.map(review => `
        <tr class="hover:bg-gray-700/30 transition-colors border-b border-gray-700/50">
            <td class="px-6 py-4 align-top">
                <div class="font-bold text-white">${review.user_name || 'Anonymous'}</div>
                <div class="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">${new Date(review.created_at).toLocaleDateString()}</div>
            </td>
            <td class="px-6 py-4 align-top">
                <div class="text-sm text-gray-300 leading-relaxed italic border-l-2 border-indigo-500/30 pl-3 mb-3">"${review.comment}"</div>
                
                <!-- Admin Reply Section -->
                <div class="mt-4 bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                    <div class="text-[10px] font-black text-indigo-400 uppercase tracking-tighter mb-2 flex items-center gap-1">
                        <i data-lucide="message-square" class="w-3 h-3"></i> ADMIN REPLY
                    </div>
                    ${review.reply ? `
                        <div class="text-xs text-green-400 font-medium mb-2 pl-2 border-l border-green-500/30">
                            ${review.reply}
                        </div>
                    ` : ''}
                    <div class="flex gap-2">
                        <input type="text" id="reply-input-${review._id}" placeholder="Write a reply..." 
                            class="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs outline-none focus:border-indigo-500"
                            value="${review.reply || ''}">
                        <button onclick="submitReply('${review._id}')" 
                            class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-[10px] font-black uppercase transition-all">
                            Save
                        </button>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 align-top">
                <div class="flex items-center gap-1 text-amber-400 bg-amber-400/5 px-2 py-1 rounded-lg w-fit">
                    <i data-lucide="star" class="w-3 h-3 fill-current"></i>
                    <span class="font-black text-sm">${review.rating}</span>
                </div>
            </td>
            <td class="px-6 py-4 align-top">
                <span class="px-2 py-1 text-[10px] font-black uppercase rounded-full ${review.status === 'approved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}">
                    ${review.status || 'Pending'}
                </span>
            </td>
            <td class="px-6 py-4 text-right align-top">
                <div class="flex justify-end gap-2">
                    ${review.status !== 'approved' ? `
                        <button onclick="updateStatus('${review._id}', 'approved')" class="p-2 bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white rounded-lg transition-all" title="Approve">
                            <i data-lucide="check" class="w-4 h-4"></i>
                        </button>
                    ` : `
                        <button onclick="updateStatus('${review._id}', 'pending')" class="p-2 bg-yellow-600/20 hover:bg-yellow-600 text-yellow-400 hover:text-white rounded-lg transition-all" title="Make Pending">
                            <i data-lucide="clock" class="w-4 h-4"></i>
                        </button>
                    `}
                    <button onclick="deleteReview('${review._id}')" class="p-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all" title="Delete">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

async function submitReply(id) {
    const replyInput = document.getElementById(`reply-input-${id}`);
    const reply = replyInput.value.trim();

    try {
        const response = await fetchWithAuth(`/reviews/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ reply })
        });
        if (response.ok) {
            alert('Reply added successfully!');
            fetchReviews();
        } else {
            alert('Failed to save reply');
        }
    } catch (e) {
        console.error(e);
    }
}

async function updateStatus(id, status) {
    try {
        const response = await fetchWithAuth(`/reviews/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        if (response.ok) {
            fetchReviews();
        }
    } catch (e) {
        console.error(e);
    }
}

async function deleteReview(id) {
    if (!confirm('Are you sure?')) return;
    try {
        const response = await fetchWithAuth(`/reviews/${id}`, { method: 'DELETE' });
        if (response.ok) fetchReviews();
    } catch (e) {
        console.error(e);
    }
}
