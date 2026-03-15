document.addEventListener('DOMContentLoaded', () => {
    fetchBooks();
    const user = JSON.parse(localStorage.getItem('adminUser'));
    if (user && user.name) document.getElementById('adminName').textContent = user.name;
    document.getElementById('bookForm').addEventListener('submit', handleFormSubmit);
});

let books = [];

async function fetchBooks() {
    const tableBody = document.getElementById('bookTableBody');
    try {
        const response = await fetchWithAuth('/books');
        if (!response.ok) throw new Error('Failed to fetch books');
        books = await response.json();
        renderTable();
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-400">Error loading books</td></tr>`;
    }
}

function renderTable() {
    const tableBody = document.getElementById('bookTableBody');
    tableBody.innerHTML = books.map(book => {
        // Handle DB fields
        const price = book.original_price || book.originalPrice || 0;
        const discounted = book.discounted_price || book.discountedPrice || price;
        let percent = 0;
        if (price > 0 && discounted < price) {
            percent = Math.round(((price - discounted) / price) * 100);
        }

        return `
        <tr class="hover:bg-indigo-500/5 transition-all group border-b border-gray-700/30">
            <td class="px-8 py-5">
                <div class="flex items-center gap-4">
                    <img src="${book.image.startsWith('http') ? book.image : '../' + book.image}" onerror="this.src='https://placehold.co/40'" class="w-12 h-12 rounded-xl object-cover bg-gray-700 shadow-lg">
                    <div class="flex flex-col">
                        <span class="font-semibold text-white group-hover:text-indigo-400 transition-colors">${book.title}</span>
                        <span class="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">${book.category || 'Standard'}</span>
                    </div>
                </div>
            </td>
            <td class="px-6 py-5">
                <span class="text-sm text-gray-400">${book.author}</span>
            </td>
            <td class="px-6 py-5">
                <div class="flex flex-col">
                    <span class="font-mono text-indigo-400 font-medium">₹${price}</span>
                    ${percent > 0 ? `<span class="text-[10px] text-gray-500 line-through mt-0.5">₹${price}</span>` : ''}
                </div>
            </td>
            <td class="px-6 py-5">
                ${percent > 0 ? `
                    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <div class="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span class="text-[10px] font-bold uppercase tracking-tight">${percent}% OFF</span>
                    </div>
                ` : '<span class="text-gray-600 text-[10px] font-bold">REGULAR</span>'}
            </td>
            <td class="px-6 py-5 text-center">
                <div class="flex flex-col items-center gap-1">
                    <div class="flex items-center gap-1.5 text-xs text-gray-300">
                        <i data-lucide="eye" class="w-3 h-3 text-indigo-400"></i>
                        <span class="font-bold">${book.views || 0}</span>
                    </div>
                    <span class="text-[10px] text-gray-500 uppercase tracking-tighter italic">Total Views</span>
                </div>
            </td>
            <td class="px-8 py-5 text-right">
                <div class="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button onclick="editBook('${book.id || book._id}')" class="p-2.5 bg-gray-700/50 hover:bg-indigo-600 text-gray-300 hover:text-white rounded-xl transition-all border border-gray-600">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteBook('${book.id || book._id}')" class="p-2.5 bg-gray-700/50 hover:bg-red-600 text-gray-300 hover:text-white rounded-xl transition-all border border-gray-600">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>
    `
}).join('');
    lucide.createIcons();
}

// Preview Image (unchanged)
function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    const fileName = document.getElementById('fileName');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.style.backgroundImage = `url('${e.target.result}')`;
            preview.classList.remove('hidden');
        }
        reader.readAsDataURL(input.files[0]);
        fileName.textContent = input.files[0].name;
    }
}

function openModal(isEdit = false) {
    document.getElementById('bookModal').classList.remove('hidden');
    if (!isEdit) {
        document.getElementById('modalTitle').textContent = 'Add New Book';
        document.getElementById('bookForm').reset();
        document.getElementById('bookId').value = '';

        // Reset Image
        document.getElementById('imagePreview').classList.add('hidden');
        document.getElementById('imagePreview').style.backgroundImage = '';
        document.getElementById('fileName').textContent = 'No file chosen';
        document.getElementById('image').value = '';
    }
}

function closeModal() {
    document.getElementById('bookModal').classList.add('hidden');
}

function editBook(id) {
    const book = books.find(b => (b.id === id || b._id === id));
    if (!book) return;

    // Calculate percent back from DB prices
    const price = book.original_price || book.originalPrice || 0;
    const discounted = book.discounted_price || book.discountedPrice || price;
    let percent = 0;
    if (price > 0 && discounted < price) {
        percent = Math.round(((price - discounted) / price) * 100);
    }

    document.getElementById('bookId').value = id;
    document.getElementById('title').value = book.title;
    document.getElementById('author').value = book.author;
    document.getElementById('price').value = price;
    document.getElementById('discountPercent').value = percent;
    document.getElementById('category').value = book.category || '';
    document.getElementById('buyLink').value = book.buy_link || book.buyLink || '';
    document.getElementById('language').value = book.language || 'English';
    document.getElementById('image').value = book.image;
    document.getElementById('description').value = book.description || '';

    // Show Preview
    const preview = document.getElementById('imagePreview');
    if (book.image) {
        const imgUrl = book.image.startsWith('http') ? book.image : `../${book.image}`;
        preview.style.backgroundImage = `url('${imgUrl}')`;
        preview.classList.remove('hidden');
        document.getElementById('fileName').textContent = 'Current Image kept';
    } else {
        preview.classList.add('hidden');
    }

    document.getElementById('modalTitle').textContent = 'Edit Book';
    document.getElementById('bookModal').classList.remove('hidden');
}

async function deleteBook(id) {
    if (!confirm('Are you sure?')) return;
    try {
        const response = await fetchWithAuth(`/books/${id}`, { method: 'DELETE' });
        if (response.ok) fetchBooks();
    } catch (e) { console.error(e); }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    try {
        const id = document.getElementById('bookId').value;
        let imageUrl = document.getElementById('image').value;
        const imageFile = document.getElementById('imageFile').files[0];

        // 1. Upload Image if selected
        if (imageFile) {
            const formData = new FormData();
            formData.append('file', imageFile);

            // Assuming we have a way to show upload status, or just wait
            const uploadRes = await fetchWithAuth('/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Image upload failed');
            const uploadData = await uploadRes.json();
            imageUrl = uploadData.url;
        }

        // Calculate fields for DB
        const price = parseFloat(document.getElementById('price').value) || 0;
        const discount = parseFloat(document.getElementById('discountPercent').value) || 0;
        const discountedPrice = price - (price * (discount / 100));

        const data = {
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            original_price: price,
            discounted_price: discountedPrice,
            category: document.getElementById('category').value,
            buy_link: document.getElementById('buyLink').value,
            language: document.getElementById('language').value,
            image: imageUrl,
            description: document.getElementById('description').value,
            stock: 100, // Default stock
            status: 'published'
        };

        const url = id ? `/books/${id}` : '/books';
        const method = id ? 'PUT' : 'POST';
        const response = await fetchWithAuth(url, { method, body: JSON.stringify(data) });

        if (response.ok) {
            closeModal();
            fetchBooks();
            // Cleanup input
            document.getElementById('imageFile').value = '';
        } else {
            const err = await response.json().catch(() => ({}));
            alert('Failed to save book: ' + (err.message || 'Unknown error'));
        }
    } catch (e) {
        console.error(e);
        alert('Error: ' + e.message);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}
