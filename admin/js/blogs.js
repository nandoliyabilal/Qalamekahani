// Blogs Management - Admin Panel

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadBlogs();
    setupImageUpload();
});

// DOM Elements
const blogTableBody = document.getElementById('blogTableBody');
const blogModal = document.getElementById('blogModal');
const blogForm = document.getElementById('blogForm');
const modalTitle = document.getElementById('modalTitle');

// State
let blogs = [];
let isEditing = false;

// Fetch Blogs
async function loadBlogs() {
    try {
        const res = await fetch('/api/blogs');
        if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.message || 'Failed to fetch blogs');
        }
        blogs = await res.json();
        renderBlogs();
    } catch (err) {
        console.error(err);
        blogTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-400">Error loading blogs: ${err.message}</td></tr>`;
    }
}

// Render Blogs
function renderBlogs() {
    const mobileBody = document.getElementById('blogMobileBody');
    if (blogs.length === 0) {
        blogTableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">No blog posts found.</td></tr>`;
        if (mobileBody) mobileBody.innerHTML = `<div class="py-12 text-center text-gray-500">No blog posts found.</div>`;
        return;
    }

    // Render Desktop Table
    blogTableBody.innerHTML = blogs.map(blog => `
        <tr class="hover:bg-gray-700/50 transition-colors">
            <td class="px-6 py-4 font-medium text-white">${blog.title}</td>
            <td class="px-6 py-4">${blog.author}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    ${blog.category}
                </span>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-1 text-xs text-gray-400">
                    <i data-lucide="eye" class="w-3 h-3 text-indigo-400"></i>
                    <span>${blog.views || 0}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-gray-400 text-xs">
                ${new Date(blog.created_at).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button onclick="editBlog('${blog.id}')" 
                        class="p-2 text-blue-400 hover:text-white hover:bg-blue-600/20 rounded-lg transition-colors" title="Edit">
                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteBlog('${blog.id}')" 
                        class="p-2 text-red-400 hover:text-white hover:bg-red-600/20 rounded-lg transition-colors" title="Delete">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Render Mobile Cards
    if (mobileBody) {
        mobileBody.innerHTML = blogs.map(blog => {
            let imgUrl = blog.image || 'https://placehold.co/100';
            if (imgUrl && !imgUrl.startsWith('http')) imgUrl = `/${imgUrl}`;
            
            return `
            <div class="bg-gray-800 rounded-xl p-3 flex gap-4 relative overflow-visible shadow-lg border border-gray-700">
                <!-- Left: ImagePortrait -->
                <div class="relative w-[85px] h-[100px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-900 border border-gray-700 cursor-pointer" onclick="editBlog('${blog.id}')">
                    <img src="${imgUrl}" onerror="this.src='https://placehold.co/100'" class="w-full h-full object-cover">
                </div>
                
                <!-- Right: Details -->
                <div class="flex-1 flex flex-col justify-start py-0.5">
                    <div class="flex justify-between items-start gap-2 h-7 relative z-20">
                        <h3 class="text-white font-bold text-base leading-tight line-clamp-2 cursor-pointer pr-5" onclick="editBlog('${blog.id}')">
                            ${blog.title || 'Untitled'}
                        </h3>
                        
                        <!-- 3-Dot Menu -->
                        <div class="absolute -top-1 -right-2 dropdown-container">
                            <button onclick="toggleMobileMenu(event, '${blog.id}')" class="text-gray-400 hover:text-white p-2">
                                <i data-lucide="more-vertical" class="w-5 h-5"></i>
                            </button>
                            <!-- Dropdown Content -->
                            <div id="dropdown-${blog.id}" class="hidden absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 w-36 z-50">
                                <button onclick="editBlog('${blog.id}')" class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2">
                                    <i data-lucide="edit-2" class="w-4 h-4 text-blue-400"></i> Edit
                                </button>
                                <button onclick="deleteBlog('${blog.id}')" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-700 flex items-center gap-2">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Excerpt / Date -->
                    <div class="mt-4 text-left">
                        <div class="text-[11px] text-gray-300 font-medium bg-gray-700/50 px-2 py-0.5 rounded w-fit border border-gray-700 mb-2 truncate max-w-full">${blog.category || 'Opinion'}</div>
                        <div class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">${new Date(blog.created_at).toLocaleDateString()}</div>
                    </div>
                    
                    <!-- Views -->
                    <div class="mt-auto pt-2 text-gray-400 text-xs font-medium">
                        ${blog.views || 0} views.
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    // Re-init icons for dynamic content
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

// Modal Functions
function openModal() {
    blogModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    blogForm.reset();
    document.getElementById('blogId').value = '';
    document.getElementById('imagePreview').style.backgroundImage = '';
    document.getElementById('imagePreview').classList.add('hidden');
    modalTitle.textContent = 'Add New Post';
    isEditing = false;
}

function closeModal() {
    blogModal.classList.add('hidden');
    document.body.style.overflow = '';
}

// Image Upload Logic
function setupImageUpload() {
    const fileInput = document.getElementById('imageFile');
    const urlInput = document.getElementById('imageUrl');
    const preview = document.getElementById('imagePreview');
    const status = document.getElementById('uploadStatus');

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        status.textContent = 'Uploading...';
        status.classList.remove('hidden', 'text-green-400', 'text-red-400');
        status.classList.add('text-yellow-400'); // set strictly to processing color if needed or default gray

        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            urlInput.value = data.url; // Assuming backend returns relative path or full URL

            // Show preview
            const previewUrl = data.url.startsWith('http') ? data.url : `/${data.url}`;
            preview.style.backgroundImage = `url(${previewUrl})`;
            preview.classList.remove('hidden');

            status.textContent = 'Upload Successful';
            status.classList.remove('text-gray-400', 'text-yellow-400');
            status.classList.add('text-green-400');

        } catch (err) {
            console.error(err);
            status.textContent = 'Upload Failed';
            status.classList.remove('text-gray-400');
            status.classList.add('text-red-400');
        }
    });
}

// Form Submit
blogForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const blogData = {
        title: document.getElementById('title').value,
        author: document.getElementById('author').value,
        category: document.getElementById('category').value,
        readTime: document.getElementById('readTime').value,
        excerpt: document.getElementById('excerpt').value,
        content: document.getElementById('content').value,
        image: document.getElementById('imageUrl').value,
        language: document.getElementById('language').value
    };

    const id = document.getElementById('blogId').value;
    const token = localStorage.getItem('adminToken');
    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/blogs/${id}` : '/api/blogs';

    try {
        const res = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(blogData)
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Failed to save blog');
        }

        closeModal();
        loadBlogs(); // Refresh
        // alert(isEditing ? 'Blog updated!' : 'Blog created!');

    } catch (err) {
        console.error(err);
        alert(err.message);
    }
});

// Edit Blog
window.editBlog = (id) => {
    const blog = blogs.find(b => b.id === id);
    if (!blog) return;

    openModal();
    isEditing = true;
    modalTitle.textContent = 'Edit Blog Post';

    document.getElementById('blogId').value = blog.id;
    document.getElementById('title').value = blog.title;
    document.getElementById('author').value = blog.author;
    document.getElementById('category').value = blog.category;
    document.getElementById('readTime').value = blog.readTime || '';
    document.getElementById('excerpt').value = blog.excerpt || '';
    document.getElementById('content').value = blog.content || '';
    document.getElementById('imageUrl').value = blog.image || '';
    document.getElementById('language').value = blog.language || 'English';

    if (blog.image) {
        const previewUrl = blog.image.startsWith('http') ? blog.image : `/${blog.image}`;
        document.getElementById('imagePreview').style.backgroundImage = `url(${previewUrl})`;
        document.getElementById('imagePreview').classList.remove('hidden');
    }

};

// Delete Blog
window.deleteBlog = async (id) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`/api/blogs/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error('Failed to delete');
        loadBlogs();

    } catch (err) {
        console.error(err);
        alert('Error deleting post');
    }
};
