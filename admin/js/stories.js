
document.addEventListener('DOMContentLoaded', () => {
    fetchStories();

    // Set Admin Name from cache first to avoid flicker
    const user = JSON.parse(localStorage.getItem('adminUser'));
    if (user && user.name) {
        document.getElementById('adminName').textContent = user.name;
    }

    document.getElementById('storyForm').addEventListener('submit', handleFormSubmit);

    // Price/Discount dynamic check
    const priceInput = document.getElementById('price');
    const discountInput = document.getElementById('discount');
    if (priceInput && discountInput) {
        priceInput.addEventListener('input', () => {
            if (parseFloat(priceInput.value) > 0) {
                discountInput.parentElement.style.opacity = '1';
                discountInput.disabled = false;
            } else {
                discountInput.parentElement.style.opacity = '0.5';
                discountInput.value = 0;
                discountInput.disabled = true;
            }
        });
        // Init state
        priceInput.dispatchEvent(new Event('input'));
    }
});

// State
let stories = [];

// Fetch Stories
async function fetchStories() {
    const tableBody = document.getElementById('storyTableBody');
    try {
        const response = await fetchWithAuth('/stories');
        if (!response.ok) throw new Error('Failed to fetch stories');

        stories = await response.json();
        renderTable();
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="5" class="px-6 py-4 text-center text-red-400">Error loading stories</td></tr>`;
    }
}

// Render Table
function renderTable() {
    const tableBody = document.getElementById('storyTableBody');
    tableBody.innerHTML = stories.map(story => {
        // Handle Image URL
        let imgUrl = story.image || 'https://placehold.co/40';
        if (!imgUrl.startsWith('http')) {
            imgUrl = `../${imgUrl}`;
        }

        return `
        <tr class="hover:bg-gray-700/30 transition-colors group">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <img src="${imgUrl}" onerror="this.src='https://placehold.co/40'" class="w-10 h-10 rounded-lg object-cover bg-gray-700">
                    <div>
                        <div class="font-medium text-white">${story.title}</div>
                        <div class="text-xs text-indigo-400">${story.language || 'Hindi'}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">${story.author}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 text-xs font-medium rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    ${story.category}
                </span>
            </td>
            <td class="px-6 py-4 text-xs font-medium">
                ${parseFloat(story.price) > 0
                ? `<span class="text-green-400">₹${story.price}</span>${parseFloat(story.discount) > 0 ? ` <span class="text-gray-500 line-through text-[10px]">(${story.discount}%)</span>` : ''}`
                : '<span class="text-blue-300">Free</span>'}
            </td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-1 text-xs text-gray-400">
                    <i data-lucide="eye" class="w-3 h-3 text-indigo-400"></i>
                    <span>${story.views || 0}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-gray-500 text-xs">
                ${moment(story.created_at || story.date).format('MMM D, YYYY')}
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="editStory('${story.id}')" class="p-2 bg-gray-700 hover:bg-indigo-600 text-gray-300 hover:text-white rounded-lg transition-colors">
                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteStory('${story.id}')" class="p-2 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition-colors">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');

    lucide.createIcons();
}

// Delete Story
async function deleteStory(id) {
    if (!confirm('Are you sure you want to delete this story?')) return;

    try {
        const response = await fetchWithAuth(`/stories/${id}`, { method: 'DELETE' });
        if (response.ok) {
            fetchStories(); // Refresh
        } else {
            alert('Failed to delete story');
        }
    } catch (error) {
        console.error(error);
        alert('Error deleting story');
    }
}

// Modal Functions
function openModal(isEdit = false) {
    const modal = document.getElementById('storyModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('storyForm');

    modal.classList.remove('hidden');

    if (!isEdit) {
        title.textContent = 'Add New Story';
        form.reset();
        document.getElementById('storyId').value = '';
        document.getElementById('imagePreview').classList.add('hidden');

        document.getElementById('chaptersContainer').innerHTML = '';
        document.getElementById('youtubeLink').value = '';
        document.getElementById('price').value = '0';
        document.getElementById('discount').value = '0';
        addChapterField('Chapter 1', '');
    }
}

function closeModal() {
    document.getElementById('storyModal').classList.add('hidden');
}

// Edit Story
function editStory(id) {
    const story = stories.find(s => s.id === id);
    if (!story) return;

    document.getElementById('storyId').value = id;
    document.getElementById('title').value = story.title;
    document.getElementById('author').value = story.author;
    document.getElementById('category').value = story.category;

    // Robust Language Selection
    const langSelect = document.getElementById('language');
    const storyLang = (story.language || 'Hindi').toLowerCase();
    let langFound = false;
    for (let i = 0; i < langSelect.options.length; i++) {
        if (langSelect.options[i].value.toLowerCase() === storyLang) {
            langSelect.selectedIndex = i;
            langFound = true;
            break;
        }
    }
    if (!langFound) langSelect.value = 'Hindi';

    document.getElementById('imageUrl').value = story.image || '';
    document.getElementById('price').value = story.price || 0;
    document.getElementById('discount').value = story.discount || 0;
    document.getElementById('descriptionInput').value = story.summary || story.synopsis || '';
    document.getElementById('youtubeLink').value = story.youtube_link || '';

    // --- LOAD CHAPTERS ---
    const container = document.getElementById('chaptersContainer');
    container.innerHTML = ''; // Clear

    let content = story.content || '';

    // DECODE HTML ENTITIES (Fix for raw tags appearing in text box)
    // If the DB returned escaped HTML, we need to unescape it first
    const txt = document.createElement('textarea');
    txt.innerHTML = content;
    content = txt.value;

    // Parse existing content to find chapters
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const nodes = Array.from(doc.body.children);

    let currentTitle = '';
    let currentBody = '';
    let parsedChapters = [];

    const flush = () => {
        if (currentTitle || currentBody.trim()) {
            parsedChapters.push({ title: currentTitle || 'Chapter', body: currentBody.trim() });
        }
        currentTitle = '';
        currentBody = '';
    };

    let foundH2 = false;
    nodes.forEach(node => {
        if (node.tagName === 'H2') {
            foundH2 = true;
            flush();
            currentTitle = node.textContent;
        } else {
            currentBody += node.outerHTML + '\n';
        }
    });
    flush();

    if (parsedChapters.length === 0) {
        // Fallback for old content (no H2s)
        if (content.trim()) {
            addChapterField('Chapter 1', content);
        } else {
            addChapterField('Chapter 1', '');
        }
    } else {
        parsedChapters.forEach(ch => addChapterField(ch.title, ch.body));
    }

    // Show Preview
    const preview = document.getElementById('imagePreview');
    if (story.image) {
        const imgUrl = story.image.startsWith('http') ? story.image : `../${story.image}`;
        preview.style.backgroundImage = `url('${imgUrl}')`;
        preview.classList.remove('hidden');
    } else {
        preview.classList.add('hidden');
    }

    document.getElementById('modalTitle').textContent = 'Edit Story';
    openModal(true);

    // Refresh Discount state
    const pInput = document.getElementById('price');
    if (pInput) pInput.dispatchEvent(new Event('input'));
}

// --- CHAPTER BUILDER FUNCTION ---
function addChapterField(titleValue = '', bodyValue = '') {
    const container = document.getElementById('chaptersContainer');
    const index = container.children.length + 1;

    const div = document.createElement('div');
    div.className = 'p-4 bg-gray-700/30 border border-gray-600 rounded-lg relative group';
    div.innerHTML = `
        <button type="button" onclick="this.parentElement.remove()" 
            class="absolute top-2 right-2 text-gray-500 hover:text-red-400 transition-colors">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
        <div class="space-y-3">
            <div>
                <input type="text" placeholder="Chapter Title (e.g. Chapter ${index})" value="${titleValue}"
                    class="chapter-title-input w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none font-bold">
            </div>
            <div>
                <textarea placeholder="Write chapter content here..." rows="5"
                    class="chapter-body-input w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none">${bodyValue.replace(/<p>/g, '').replace(/<\/p>/g, '\n').trim()}</textarea>
            </div>
        </div>
    `;
    container.appendChild(div);
    lucide.createIcons();
}

// Handle Form Submit (Create/Update)
async function handleFormSubmit(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    try {
        const id = document.getElementById('storyId').value;
        const isEdit = !!id;

        let imageUrl = document.getElementById('imageUrl').value;
        const imageFile = document.getElementById('imageFile').files[0];

        // 1. Upload Image
        if (imageFile) {
            const formData = new FormData();
            formData.append('file', imageFile);
            document.getElementById('uploadStatus').classList.remove('hidden');
            const uploadRes = await fetchWithAuth('/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
                body: formData
            });
            if (!uploadRes.ok) throw new Error('Image upload failed');
            const uploadData = await uploadRes.json();
            imageUrl = uploadData.url;
            document.getElementById('uploadStatus').classList.add('hidden');
        }

        // 2. CONSTRUCT FULL CONTENT FROM CHAPTERS
        const chapterDivs = document.querySelectorAll('#chaptersContainer > div');
        let constructedContent = '';

        chapterDivs.forEach((div, idx) => {
            const title = div.querySelector('.chapter-title-input').value.trim() || `Chapter ${idx + 1}`;
            const rawBody = div.querySelector('.chapter-body-input').value;

            // Convert newlines to paragraphs
            const formattedBody = rawBody
                .split(/\n\s*\n/)
                .map(p => p.trim() ? `<p>${p.trim()}</p>` : '')
                .join('');

            constructedContent += `<h2 class="chapter-title" id="chapter-${idx + 1}">${title}</h2>\n${formattedBody}\n\n`;
        });

        const storyData = {
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            category: document.getElementById('category').value,
            language: document.getElementById('language').value,
            coverImage: imageUrl,
            summary: document.getElementById('descriptionInput').value,
            fullContent: constructedContent, // Saved as HTML
            tags: [],
            youtubeLink: document.getElementById('youtubeLink').value,
            price: parseFloat(document.getElementById('price').value) || 0,
            discount: parseFloat(document.getElementById('discount').value) || 0,
            status: 'published'
        };

        const url = isEdit ? `/stories/${id}` : '/stories';
        const method = isEdit ? 'PUT' : 'POST';

        const response = await fetchWithAuth(url, { method, body: JSON.stringify(storyData) });

        if (response.ok) {
            closeModal();
            fetchStories();
            // Reset
            document.getElementById('imagePreview').classList.add('hidden');
            document.getElementById('imageFile').value = '';
        } else {
            const data = await response.json();
            alert(data.message || 'Operation failed');
        }
    } catch (error) {
        console.error(error);
        alert('Error saving story: ' + error.message);
    } finally {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
}
