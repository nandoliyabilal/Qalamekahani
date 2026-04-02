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
    const mobileBody = document.getElementById('imageMobileBody');
    if (!tbody || !mobileBody) return;

    if (!images || images.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No images found. Add your first image!</td></tr>`;
        mobileBody.innerHTML = `<div class="py-12 text-center text-gray-500">No images found.</div>`;
        return;
    }

    // Render Desktop Table
    tbody.innerHTML = images.map(img => {
        const dateStr = moment(img.created_at).format('MMM D, YYYY');
        let coverSrc = img.image;
        if (coverSrc && !coverSrc.startsWith('http')) {
            coverSrc = '/' + coverSrc.replace(/\\/g, '/').replace(/^\/?/, '');
        }

        return `
            <tr class="hover:bg-gray-700/50 transition-colors group">
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
            </tr>
        `;
    }).join('');

    // Render Mobile Cards
    mobileBody.innerHTML = images.map(img => {
        let coverSrc = img.image;
        if (coverSrc && !coverSrc.startsWith('http')) {
            coverSrc = '/' + coverSrc.replace(/\\/g, '/').replace(/^\/?/, '');
        }
        const dateStr = moment(img.created_at).format('MMM D, YYYY');

        return `
        <div class="bg-gray-800 rounded-xl p-3 flex gap-4 relative overflow-visible shadow-lg border border-gray-700">
            <!-- Left: ImagePortrait -->
            <div class="relative w-[85px] h-[100px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-900 border border-gray-700">
                <img src="${coverSrc}" onerror="this.src='https://placehold.co/100'" class="w-full h-full object-cover">
            </div>
            
            <!-- Right: Details -->
            <div class="flex-1 flex flex-col justify-start py-0.5">
                <div class="flex justify-between items-start gap-2 h-7 relative z-20">
                    <h3 class="text-white font-bold text-base leading-tight line-clamp-2 pr-5">
                        ${img.title || 'Untitled'}
                    </h3>
                    
                    <!-- 3-Dot Menu -->
                    <div class="absolute -top-1 -right-2 dropdown-container">
                        <button onclick="toggleMobileMenu(event, '${img.id}')" class="text-gray-400 hover:text-white p-2">
                            <i data-lucide="more-vertical" class="w-5 h-5"></i>
                        </button>
                        <!-- Dropdown Content -->
                        <div id="dropdown-${img.id}" class="hidden absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 w-36 z-50">
                            <button onclick="deleteImage('${img.id}', '${img.title.replace(/'/g, "\\'")}')" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-700 flex items-center gap-2">
                                <i data-lucide="trash-2" class="w-4 h-4"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Category / Date -->
                <div class="mt-4 text-left">
                    <div class="text-[11px] text-gray-300 font-medium bg-gray-700/50 px-2 py-0.5 rounded w-fit border border-gray-700 mb-2 truncate max-w-full">${img.category || 'General'}</div>
                    <div class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">${dateStr}</div>
                </div>
                
                <!-- Downloads -->
                <div class="mt-auto pt-2 text-gray-400 text-xs font-medium flex items-center gap-1">
                    <i data-lucide="download" class="w-3.5 h-3.5 text-indigo-400"></i>
                    ${img.downloads || 0} downloads
                </div>
            </div>
        </div>`;
    }).join('');

    lucide.createIcons();
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
};

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
    formData.append('file', file);

    const statusEl = document.getElementById('uploadStatus');
    statusEl.classList.remove('hidden');
    statusEl.innerText = 'Uploading...';
    statusEl.classList.replace('text-red-400', 'text-gray-400');

    try {
        const res = await fetchWithAuth('/upload', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error('Upload failed');

        const data = await res.json();
        const fileUrl = data.url;

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

    if (!image) {
        alert('Please wait for the image to upload or select an image.');
        return;
    }

    const payload = {
        title,
        category,
        image
    };

    try {
        const res = await fetchWithAuth('/gallery', {
            method: 'POST',
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
        const res = await fetchWithAuth(`/gallery/${id}`, {
            method: 'DELETE'
        });

        if (!res.ok) throw new Error('Failed to delete');

        fetchImages();
    } catch (err) {
        alert(err.message);
    }
}
