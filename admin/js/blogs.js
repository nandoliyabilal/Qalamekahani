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
        if (!res.ok) throw new Error('Failed to fetch blogs');
        blogs = await res.json();
        renderBlogs();
    } catch (err) {
        console.error(err);
        blogTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-400">Error loading blogs</td></tr>`;
    }
}

// Render Blogs
function renderBlogs() {
    if (blogs.length === 0) {
        blogTableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">No blog posts found.</td></tr>`;
        return;
    }

    blogTableBody.innerHTML = blogs.map(blog => `
        <tr class="hover:bg-gray-700/50 transition-colors">
            <td class="px-6 py-4 font-medium text-white">${blog.title}</td>
            <td class="px-6 py-4">${blog.author}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    ${blog.category}
                </span>
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

    // Re-init icons for dynamic content
    lucide.createIcons();
}

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
