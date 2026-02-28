document.addEventListener('DOMContentLoaded', () => {
    fetchAudio();
    const user = JSON.parse(localStorage.getItem('adminUser'));
    if (user && user.name) document.getElementById('adminName').textContent = user.name;
    document.getElementById('audioForm').addEventListener('submit', handleFormSubmit);
});

let audioData = [];

async function fetchAudio() {
    const tableBody = document.getElementById('audioTableBody');
    try {
        const response = await fetchWithAuth('/audio');
        if (!response.ok) throw new Error('Failed');
        audioData = await response.json();
        renderTable();
    } catch (e) {
        tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-red-400">Error loading audio</td></tr>`;
    }
}


async function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetchWithAuth('/upload', {
        method: 'POST',
        body: formData
    });
    if (!response.ok) throw new Error('Upload failed');
    const data = await response.json();
    return data.url;
}

function getAudioDuration(file) {
    return new Promise((resolve) => {
        const audio = new Audio(URL.createObjectURL(file));
        // Timeout after 3 seconds to prevent hanging
        const timeout = setTimeout(() => resolve('--:--'), 3000);

        audio.onloadedmetadata = () => {
            clearTimeout(timeout);
            const minutes = Math.floor(audio.duration / 60);
            const seconds = Math.floor(audio.duration % 60);
            resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        };
        audio.onerror = () => {
            clearTimeout(timeout);
            resolve('--:--');
        }
    });
}

function renderTable() {
    const tableBody = document.getElementById('audioTableBody');
    tableBody.innerHTML = audioData.map(audio => {
        const isPremium = audio.price > 0;
        const discountBadge = audio.discount > 0 ? `<span class="ml-2 text-xs text-green-400">-${audio.discount}%</span>` : '';
        const premiumBadge = isPremium ? `<span class="ml-2 px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-500 rounded border border-yellow-500/30">Premium</span>` : '';
        const priceDisplay = isPremium ? `<div class="text-xs text-gray-400 mt-1">₹${audio.price}${discountBadge}</div>` : '<div class="text-xs text-green-400 mt-1">Free</div>';

        return `
        <tr class="hover:bg-gray-700/30 transition-colors group">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <div class="relative">
                        <img src="${(audio.image && audio.image.startsWith('http')) ? audio.image : '../' + (audio.image || 'images/audio-cover.png')}" onerror="this.src='https://placehold.co/40'" class="w-10 h-10 rounded-lg object-cover bg-gray-700">
                        ${isPremium ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border border-gray-800"></div>' : ''}
                    </div>

                    <div class="font-medium text-white">
                        ${audio.title} ${premiumBadge}
                        <div class="text-xs text-gray-500 font-normal">${audio.author || 'Unknown Author'}</div>
                        ${priceDisplay}
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 text-gray-400 font-mono text-xs">${audio.duration || '--:--'}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">${audio.category || 'General'}</span></td>
            <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="editAudio('${audio.id || audio._id}')" class="p-2 bg-gray-700 hover:bg-indigo-600 text-gray-300 hover:text-white rounded-lg"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    <button onclick="deleteAudio('${audio.id || audio._id}')" class="p-2 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </td>
        </tr>
    `}).join('');
    lucide.createIcons();
}

function openModal(isEdit = false) {
    document.getElementById('audioModal').classList.remove('hidden');
    document.getElementById('audioFile').value = ''; // Always clear file input
    document.getElementById('imageFile').value = ''; // Always clear file input
    document.getElementById('currentAudio').textContent = '';
    document.getElementById('currentImage').textContent = '';

    if (!isEdit) {
        document.getElementById('modalTitle').textContent = 'Add New Audio';
        document.getElementById('audioForm').reset();
        document.getElementById('audioId').value = '';
        document.getElementById('imageUrl').value = 'images/audio-cover.png';
        document.getElementById('duration').value = '';
        document.getElementById('author').value = '';
        document.getElementById('description').value = '';
        document.getElementById('price').value = '0';
        document.getElementById('discount').value = '0';
    }
}

function closeModal() { document.getElementById('audioModal').classList.add('hidden'); }

function editAudio(id) {
    // Loose equality to handle string/number mismatch
    const item = audioData.find(a => (a.id == id || a._id == id));
    if (!item) return;
    document.getElementById('audioId').value = id;
    document.getElementById('title').value = item.title;
    document.getElementById('author').value = item.author || '';
    document.getElementById('description').value = item.description || '';
    document.getElementById('duration').value = item.duration;
    document.getElementById('category').value = item.category;
    document.getElementById('imageUrl').value = item.image;
    document.getElementById('price').value = item.price || 0;
    document.getElementById('discount').value = item.discount || 0;

    // Show current file info
    if (item.file_url) {
        document.getElementById('currentAudio').textContent = `Current: ${item.file_url.split('/').pop()}`;
    }

    // Image Preview
    const imgPreview = document.getElementById('imagePreview');
    if (item.image) {
        imgPreview.src = item.image.startsWith('http') || item.image.startsWith('/') ? item.image : `../${item.image}`;
        imgPreview.classList.remove('hidden');
        document.getElementById('currentImage').textContent = `Current: ${item.image.split('/').pop()}`;
    } else {
        imgPreview.src = '';
        imgPreview.classList.add('hidden');
        document.getElementById('currentImage').textContent = '';
    }

    document.getElementById('modalTitle').textContent = 'Edit Audio';
    openModal(true);
}

// Helper to preview selected image
document.getElementById('imageFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    const imgPreview = document.getElementById('imagePreview');
    if (file) {
        imgPreview.src = URL.createObjectURL(file);
        imgPreview.classList.remove('hidden');
        document.getElementById('currentImage').textContent = `Selected: ${file.name}`;
    }
});

async function deleteAudio(id) {
    if (!confirm('Are you sure?')) return;
    try {
        const response = await fetchWithAuth(`/audio/${id}`, { method: 'DELETE' });
        if (response.ok) fetchAudio();
    } catch (e) { console.error(e); }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    // UI Feedback
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        const id = document.getElementById('audioId').value;

        let imagePath = document.getElementById('imageUrl').value;
        let duration = document.getElementById('duration').value;

        // Loose equality check
        let existingItem = id ? audioData.find(a => (a.id == id || a._id == id)) : null;
        let fileUrl = existingItem ? existingItem.file_url : '';

        // If invalid imagePath (like empty string from cleared form), try to recover from existing item
        if (!imagePath && existingItem) {
            imagePath = existingItem.image;
        }

        const audioFile = document.getElementById('audioFile').files[0];
        const imageFile = document.getElementById('imageFile').files[0];

        if (imageFile) {
            imagePath = await uploadFile(imageFile);
        }

        if (audioFile) {
            fileUrl = await uploadFile(audioFile);
            duration = await getAudioDuration(audioFile);
        } else if (!fileUrl) {
            // Case: New Audio but no file selected
            if (!id) throw new Error("Please upload an audio file");
        }

        // Ensure we send numbers for price/discount
        const priceVal = document.getElementById('price').value;
        const discountVal = document.getElementById('discount').value;

        const data = {
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            description: document.getElementById('description').value,
            duration: duration,
            category: document.getElementById('category').value,
            image: imagePath,
            file_url: fileUrl,
            price: priceVal ? parseFloat(priceVal) : 0,
            discount: discountVal ? parseFloat(discountVal) : 0,
        };

        const url = id ? `/audio/${id}` : '/audio';
        const method = id ? 'PUT' : 'POST';
        const response = await fetchWithAuth(url, { method, body: JSON.stringify(data) });

        if (response.ok) {
            closeModal();
            fetchAudio();
        } else {
            const err = await response.json();
            throw new Error(err.message || 'Failed to save');
        }
    } catch (e) {
        console.error(e);
        alert(`Error saving audio: ${e.message}`);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}
