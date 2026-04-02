
document.addEventListener('DOMContentLoaded', () => {
    fetchReviews();
    const user = JSON.parse(localStorage.getItem('adminUser'));
    if (user && user.name) {
        const adminNameEl = document.getElementById('adminName');
        if (adminNameEl) adminNameEl.textContent = user.name;
    }
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
        console.error('Fetch Error:', e);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-400">Error loading reviews from database</td></tr>`;
    }
}

function renderTable() {
    const tableBody = document.getElementById('reviewTableBody');
    const mobileBody = document.getElementById('reviewMobileBody');
    if (!tableBody || !mobileBody || !reviews) return;

    if (reviews.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No reviews found in this category.</td></tr>`;
        mobileBody.innerHTML = `<div class="py-12 text-center text-gray-500">No reviews found.</div>`;
        return;
    }

    // Render Desktop Table
    tableBody.innerHTML = reviews.map(review => {
        const rId = review.id;
        return `
        <tr class="hover:bg-gray-700/30 transition-colors border-b border-gray-700/50">
            <td class="px-6 py-4 align-top">
                <div class="font-bold text-white">${review.user_name || 'Reader'}</div>
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
                        <div class="text-xs text-green-400 font-medium mb-2 pl-2 border-l border-green-400/30">
                            ${review.reply}
                        </div>
                    ` : ''}
                    <div class="flex gap-2">
                        <input type="text" id="reply-input-${rId}" placeholder="Write a reply..." 
                            class="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs outline-none focus:border-indigo-500 text-white"
                            value="${review.reply || ''}">
                        <button onclick="submitReply('${rId}')" 
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
                        <button onclick="updateStatus('${rId}', 'approved')" class="p-2 bg-green-600/20 hover:bg-green-600 text-green-400 hover:text-white rounded-lg transition-all" title="Approve">
                            <i data-lucide="check" class="w-4 h-4"></i>
                        </button>
                    ` : `
                        <button onclick="updateStatus('${rId}', 'pending')" class="p-2 bg-yellow-600/20 hover:bg-yellow-600 text-yellow-400 hover:text-white rounded-lg transition-all" title="Make Pending">
                            <i data-lucide="clock" class="w-4 h-4"></i>
                        </button>
                    `}
                    <button onclick="deleteReview('${rId}')" class="p-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all" title="Delete">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    }).join('');

    // Render Mobile View
    mobileBody.innerHTML = reviews.map(review => {
        const rId = review.id;
        const statusColor = review.status === 'approved' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

        return `
        <div class="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg relative overflow-visible">
            <div class="flex justify-between items-start mb-3">
                <div class="flex-1">
                    <div class="font-bold text-white text-base">${review.user_name || 'Reader'}</div>
                    <div class="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-0.5">${new Date(review.created_at).toLocaleDateString()}</div>
                </div>
                
                <!-- Toggles Status & Delete -->
                <div class="flex gap-2">
                     <button onclick="toggleMobileMenu(event, '${rId}')" class="text-gray-400 hover:text-white p-1">
                         <i data-lucide="more-vertical" class="w-5 h-5"></i>
                     </button>
                     <!-- Mobile Dropdown -->
                     <div id="dropdown-${rId}" class="hidden absolute right-4 top-12 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 w-40 z-50">
                        <button onclick="updateStatus('${rId}', '${review.status === 'approved' ? 'pending' : 'approved'}')" class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2">
                            <i data-lucide="${review.status === 'approved' ? 'clock' : 'check'}" class="w-4 h-4 text-indigo-400"></i> ${review.status === 'approved' ? 'Make Pending' : 'Approve'}
                        </button>
                        <button onclick="deleteReview('${rId}')" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-700 flex items-center gap-2">
                            <i data-lucide="trash-2" class="w-4 h-4"></i> Delete
                        </button>
                     </div>
                </div>
            </div>

            <div class="text-sm text-gray-300 leading-relaxed italic border-l-2 border-indigo-500/30 pl-3 mb-4">
                "${review.comment}"
            </div>

            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-1.5 text-amber-400 bg-amber-400/5 px-2.5 py-1 rounded-lg border border-amber-400/10">
                    <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                    <span class="font-black text-sm">${review.rating}</span>
                </div>
                <span class="px-2 py-0.5 text-[10px] font-black uppercase rounded border ${statusColor}">
                    ${review.status || 'Pending'}
                </span>
            </div>

            <!-- Mobile Reply Section -->
            <div class="bg-gray-900/40 rounded-xl p-3 border border-gray-700/50">
                <div class="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <i data-lucide="message-square" class="w-3.5 h-3.5"></i> 
                    ADMIN REPLY
                </div>
                ${review.reply ? `
                    <div class="text-xs text-emerald-400 font-medium mb-2.5 pl-2 border-l border-emerald-500/30">
                        ${review.reply}
                    </div>
                ` : ''}
                <div class="flex gap-2">
                    <input type="text" id="reply-input-mob-${rId}" placeholder="Write a reply..." 
                        class="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 text-white"
                        value="${review.reply || ''}">
                    <button onclick="submitReply('${rId}', true)" 
                        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all">
                        Save
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// Close all mobile dropdowns
document.addEventListener('click', () => {
    document.querySelectorAll('[id^="dropdown-"]').forEach(el => el.classList.add('hidden'));
});

// Toggle mobile menu visibility
window.toggleMobileMenu = function(e, id) {
    e.stopPropagation();
    const target = document.getElementById(`dropdown-${id}`);
    const isHidden = target.classList.contains('hidden');
    
    document.querySelectorAll('[id^="dropdown-"]').forEach(el => el.classList.add('hidden'));
    
    if (isHidden) {
        target.classList.remove('hidden');
    }
}

async function submitReply(id) {
    if (!id) {
        alert('Internal Error: Review ID is missing.');
        return;
    }
    const replyInput = document.getElementById(`reply-input-${id}`);
    const reply = replyInput.value.trim();

    try {
        const response = await fetchWithAuth(`/reviews/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ reply })
        });
        if (response.ok) {
            alert('Admin reply saved successfully!');
            fetchReviews();
        } else {
            const data = await response.json();
            alert('Could not save reply: ' + (data.message || 'Server error'));
        }
    } catch (e) {
        console.error('Submit Error:', e);
        alert('Network error. Is the server running?');
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
        } else {
            alert('Failed to update status.');
        }
    } catch (e) {
        console.error('Status Update Error:', e);
    }
}

async function deleteReview(id) {
    if (!confirm('Permanently delete this review?')) return;
    try {
        const response = await fetchWithAuth(`/reviews/${id}`, { method: 'DELETE' });
        if (response.ok) {
            fetchReviews();
        } else {
            alert('Delete failed.');
        }
    } catch (e) {
        console.error('Delete Error:', e);
    }
}
