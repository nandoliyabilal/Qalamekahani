const UPLOAD_URL = '/api/upload';

let currentImages = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchImages();

    document.getElementById('imageForm').addEventListener('submit', saveImage);
    
    // Listen for file upload
    document.getElementById('imageFile').addEventListener('change', uploadCoverImage);
});

async function fetchImages() {
    try {
        const res = await fetch(`${API_URL}/gallery`);
        if (!res.ok) throw new Error('Failed to fetch images');
        const data = await res.json();
        currentImages = data;
        renderImagesTable(data);
    } catch (err) {
        console.error(err);
        document.getElementById('imageTableBody').innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Error loading images</td></tr>`;
    }
}

function renderImagesTable(images) {
    const tbody = document.getElementById('imageTableBody');
    tbody.innerHTML = '';

    if (!images || images.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No images found. Add your first image!</td></tr>`;
        return;
    }

    images.forEach(img => {
        const dateStr = moment(img.created_at).format('MMM D, YYYY');
        
        let coverSrc = img.image;
        if (coverSrc && !coverSrc.startsWith('http')) {
            coverSrc = '/' + coverSrc.replace(/\\/g, '/').replace(/^\/?/, '');
        }

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-700/50 transition-colors group';
        tr.innerHTML = `
            <td class="px-6 py-4">
                <img src="${coverSrc}" class="w-16 h-12 object-cover rounded shadow-md border border-gray-600">
            </td>
            <td class="px-6 py-4">
                <div class="font-medium text-white group-hover:text-indigo-400 transition-colors">${img.title}</div>
            </td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 bg-gray-700 rounded-md text-xs font-medium text-gray-300 border border-gray-600">${img.category || 'General'}</span>
            </td>
            <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center gap-1"><i data-lucide="download" class="w-3 h-3 text-indigo-400"></i> ${img.downloads || 0}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                ${dateStr}
            </td>
            <td class="px-6 py-4 text-right whitespace-nowrap">
                <button onclick="deleteImage('${img.id}', '${img.title.replace(/'/g, "\\'")}')" class="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Delete">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
}

function openModal() {
    document.getElementById('imageModal').classList.remove('hidden');
    document.getElementById('modalTitle').innerText = 'Upload New Image';
    document.getElementById('imageForm').reset();
    document.getElementById('imageId').value = '';
    
    // reset upload preview
    document.getElementById('imageUrl').value = '';
    document.getElementById('imagePreview').style.backgroundImage = 'none';
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('imageFile').required = true;
}

function closeModal() {
    document.getElementById('imageModal').classList.add('hidden');
}

async function uploadCoverImage(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const statusEl = document.getElementById('uploadStatus');
    statusEl.classList.remove('hidden');
    statusEl.innerText = 'Uploading...';
    statusEl.classList.replace('text-red-400', 'text-gray-400');

    try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(UPLOAD_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!res.ok) throw new Error('Upload failed');

        const data = await res.json();
        const fileUrl = data.fileUrl;

        document.getElementById('imageUrl').value = fileUrl;
        
        let displayUrl = fileUrl;
        if (!displayUrl.startsWith('http')) {
            displayUrl = '/' + displayUrl.replace(/\\/g, '/').replace(/^\/?/, '');
        }

        const preview = document.getElementById('imagePreview');
        preview.classList.remove('hidden');
        preview.style.backgroundImage = `url('${displayUrl}')`;

        statusEl.innerText = 'Upload complete!';
        statusEl.classList.replace('text-gray-400', 'text-green-400');

    } catch (err) {
        statusEl.innerText = 'Upload error: ' + err.message;
        statusEl.classList.replace('text-gray-400', 'text-red-400');
    }
}

async function saveImage(e) {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value;
    const image = document.getElementById('imageUrl').value;

    if(!image) {
        alert('Please wait for the image to upload or select an image.');
        return;
    }

    const payload = {
        title,
        category,
        image
    };

    try {
        const token = localStorage.getItem('adminToken');
        
        const res = await fetch(`${API_URL}/gallery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error('Failed to save image');

        closeModal();
        fetchImages();

    } catch (err) {
        alert(err.message);
    }
}

async function deleteImage(id, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API_URL}/gallery/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to delete');
        
        fetchImages();
    } catch (err) {
        alert(err.message);
    }
}
