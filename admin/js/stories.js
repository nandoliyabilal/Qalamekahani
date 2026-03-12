
document.addEventListener('DOMContentLoaded', () => {
    fetchStories();

    // Set Admin Name from cache first to avoid flicker
    const user = JSON.parse(localStorage.getItem('adminUser'));
    if (user && user.name) {
        const adminNameEl = document.getElementById('adminName');
        if (adminNameEl) adminNameEl.textContent = user.name;
    }

    const storyForm = document.getElementById('storyForm');
    if (storyForm) storyForm.addEventListener('submit', handleFormSubmit);

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
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-4 text-center text-red-400">Error loading stories</td></tr>`;
    }
}

// Render Table
function renderTable() {
    const tableBody = document.getElementById('storyTableBody');
    if (!tableBody || !stories) return;

    if (stories.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500 font-medium">No stories found. Click "Add New Story" to get started.</td></tr>`;
        return;
    }

    try {
        tableBody.innerHTML = stories.map(story => {
            // Handle Image URL
            let imgUrl = story.image || 'https://placehold.co/40';
            if (!imgUrl.startsWith('http')) {
                imgUrl = `../${imgUrl}`;
            }

            // Safe Chapter Count Calculation
            const content = story.content || '';
            const chapterCount = (content.match(/<h2/g) || []).length || (content.trim() ? 1 : 0);

            return `
            <tr class="hover:bg-gray-700/30 transition-colors group">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <img src="${imgUrl}" onerror="this.src='https://placehold.co/40'" class="w-10 h-10 rounded-lg object-cover bg-gray-700 border border-gray-700">
                        <div class="cursor-pointer" onclick="openChaptersView('${story.id}')">
                            <div class="font-medium text-white hover:text-indigo-400 transition-colors">${story.title || 'Untitled'}</div>
                            <div class="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">${story.language || 'Hindi'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-gray-400">${story.author || 'Sabirkhan Pathan'}</td>
                <td class="px-6 py-4">
                    <div class="flex flex-col gap-1">
                        <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
                            ${story.category || 'Story'}
                        </span>
                        <span class="text-[10px] text-gray-500 font-medium">${chapterCount} Chapters</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    ${parseFloat(story.price) > 0
                    ? `<span class="text-green-400 font-semibold text-sm">₹${story.price}</span>${parseFloat(story.discount) > 0 ? ` <span class="text-gray-500 line-through text-[10px]">(${story.discount}%)</span>` : ''}`
                    : '<span class="text-blue-300 font-semibold text-sm uppercase tracking-tight">Free</span>'}
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-col items-center gap-1">
                        <div class="flex items-center gap-1.5 text-xs text-gray-300">
                            <i data-lucide="eye" class="w-3.5 h-3.5 text-indigo-400"></i>
                            <span>${story.views || 0}</span>
                        </div>
                        <div class="flex items-center gap-1 text-[10px] text-yellow-500 font-bold">
                            <i data-lucide="star" class="w-2.5 h-2.5 fill-yellow-500"></i>
                            <span>${story.rating || '0.0'}</span>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-gray-500 text-xs text-center font-medium">
                    ${moment(story.created_at || story.date).format('DD/MM/YYYY')}
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="editStory('${story.id}')" class="p-2 bg-gray-700/50 hover:bg-indigo-600 text-gray-300 hover:text-white rounded-lg transition-all" title="Edit Story">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteStory('${story.id}')" class="p-2 bg-gray-700/50 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition-all" title="Delete Story">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        console.error("Render error:", err);
        tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-red-400">Error rendering stories. Check console.</td></tr>`;
    }

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

    if (modal) modal.classList.remove('hidden');

    if (!isEdit) {
        if (title) title.textContent = 'Add New Story';
        if (form) form.reset();
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
    const modal = document.getElementById('storyModal');
    if (modal) modal.classList.add('hidden');
}

// Edit Story
function editStory(id) {
    const story = stories.find(s => s.id === id);
    if (!story) return;

    document.getElementById('storyId').value = id;
    document.getElementById('title').value = story.title;
    document.getElementById('author').value = story.author;
    document.getElementById('category').value = story.category;

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

    // Load Chapters
    const container = document.getElementById('chaptersContainer');
    container.innerHTML = '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(story.content || '', 'text/html');
    const nodes = Array.from(doc.body.children);

    let parsedChapters = [];
    let currentTitle = '';
    let currentBody = '';

    const flush = () => {
        if (currentTitle || currentBody.trim()) {
            parsedChapters.push({ title: currentTitle || 'Chapter', body: currentBody.trim() });
        }
    };

    nodes.forEach(node => {
        if (node.tagName === 'H2') {
            flush();
            currentTitle = node.textContent;
            currentBody = '';
        } else {
            currentBody += node.outerHTML + '\n';
        }
    });
    flush();

    if (parsedChapters.length === 0) {
        addChapterField('Chapter 1', story.content || '');
    } else {
        parsedChapters.forEach(ch => addChapterField(ch.title, ch.body));
    }

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
    document.getElementById('price').dispatchEvent(new Event('input'));
}

function addChapterField(titleValue = '', bodyValue = '') {
    const container = document.getElementById('chaptersContainer');
    if (!container) return;
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

        if (imageFile) {
            const formData = new FormData();
            formData.append('file', imageFile);
            const uploadRes = await fetchWithAuth('/upload', { method: 'POST', body: formData });
            if (!uploadRes.ok) throw new Error('Image upload failed');
            const uploadData = await uploadRes.json();
            imageUrl = uploadData.url;
        }

        const chapterDivs = document.querySelectorAll('#chaptersContainer > div');
        let constructedContent = '';
        chapterDivs.forEach((div, idx) => {
            const title = div.querySelector('.chapter-title-input').value.trim() || `Chapter ${idx + 1}`;
            const rawBody = div.querySelector('.chapter-body-input').value;
            const formattedBody = rawBody.split(/\n\s*\n/).map(p => p.trim() ? `<p>${p.trim()}</p>` : '').join('');
            constructedContent += `<h2 class="chapter-title" id="chapter-${idx + 1}">${title}</h2>\n${formattedBody}\n\n`;
        });

        const storyData = {
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            category: document.getElementById('category').value,
            language: document.getElementById('language').value,
            coverImage: imageUrl,
            summary: document.getElementById('descriptionInput').value,
            fullContent: constructedContent,
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

// --- CHAPTERS VIEW MODAL LOGIC (THE "PROPER" ONE) ---
let activeStoryId = null;
let currentChapters = [];

async function openChaptersView(id) {
    activeStoryId = id;
    const story = stories.find(s => s.id === id);
    if (!story) return;

    const modal = document.getElementById('chaptersModal');
    const title = document.getElementById('chaptersModalTitle');
    if (modal) modal.classList.remove('hidden');
    if (title) title.textContent = `Chapters: ${story.title}`;

    currentChapters = parseChaptersFromContent(story.content || '');
    renderChapterCards(story);
}

function closeChaptersModal() {
    const modal = document.getElementById('chaptersModal');
    if (modal) modal.classList.add('hidden');
    activeStoryId = null;
}

function parseChaptersFromContent(content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content || '', 'text/html');
    const nodes = Array.from(doc.body.children);

    let chapters = [];
    let currentTitle = '';
    let currentBody = '';

    const flush = () => {
        if (currentTitle || currentBody.trim()) {
            chapters.push({
                title: currentTitle || `Chapter ${chapters.length + 1}`,
                body: currentBody.trim(),
                id: Math.random().toString(36).substr(2, 9)
            });
        }
    };

    nodes.forEach(node => {
        if (node.tagName === 'H2') {
            flush();
            currentTitle = node.textContent;
            currentBody = '';
        } else {
            currentBody += node.outerHTML + '\n';
        }
    });
    flush();

    if (chapters.length === 0 && content.trim()) {
        chapters.push({ title: 'Full Story', body: content.trim(), id: 'default' });
    }
    return chapters;
}

function renderChapterCards(story) {
    const container = document.getElementById('chaptersList');
    if (!container) return;

    if (currentChapters.length === 0) {
        container.innerHTML = `<div class="text-center py-12 text-gray-500">No chapters found. Click "Add Chapter" to start.</div>`;
        return;
    }

    container.innerHTML = currentChapters.map((ch, idx) => {
        const wordCount = ch.body.replace(/<[^>]*>/g, '').trim().split(/\s+/).length || 0;
        const readTime = Math.max(1, Math.ceil(wordCount / 200));
        const date = moment(story.created_at).format('DD/MM/YYYY');
        const rating = story.rating || '4.8';
        const views = story.views || '0';
        const reviews = story.reviewCount || '0';

        return `
        <div class="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-sm hover:border-indigo-500/50 transition-all group relative">
            <button onclick="removeChapterLocal('${ch.id}')" class="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10">
                <i data-lucide="trash-2" class="w-5 h-5"></i>
            </button>

            <div class="mb-4">
                <div class="flex items-center gap-2 mb-1">
                    <span class="text-indigo-500 font-bold text-lg">${idx + 1}.</span>
                    <input type="text" onchange="updateChapterTitle('${ch.id}', this.value)" 
                        value="${ch.title}" 
                        class="bg-transparent border-none text-white font-bold text-lg w-full focus:ring-0 p-0"
                        placeholder="Chapter Title"
                    >
                </div>
                
                <div class="flex flex-wrap items-center gap-5 text-gray-400 text-xs mt-3 bg-gray-900/40 p-2.5 rounded-lg border border-gray-700/50">
                    <div class="flex items-center gap-1.5" title="Rating">
                        <i data-lucide="star" class="w-4 h-4 text-yellow-500 fill-yellow-500"></i>
                        <span class="font-medium text-gray-200">${rating}</span>
                    </div>
                    <div class="flex items-center gap-1.5" title="Views">
                        <i data-lucide="eye" class="w-4 h-4 text-indigo-400"></i>
                        <span class="font-medium text-gray-200">${views}</span>
                    </div>
                    <div class="flex items-center gap-1.5" title="Read Time">
                        <i data-lucide="clock" class="w-4 h-4 text-green-400"></i>
                        <span class="font-medium text-gray-200">${readTime} min</span>
                    </div>
                    <div class="flex items-center gap-1.5" title="Publish Date">
                        <i data-lucide="calendar" class="w-4 h-4 text-gray-500"></i>
                        <span class="font-medium text-gray-200">${date}</span>
                    </div>
                </div>
            </div>

            <div class="flex items-center justify-between mt-4">
                <button class="px-4 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold border border-indigo-500/20 flex items-center gap-2 transition-colors">
                    ${reviews} Reviews
                    <i data-lucide="chevron-right" class="w-3 h-3"></i>
                </button>
                <button onclick="toggleChapterEditor('${ch.id}')" class="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                    <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                    Edit Content
                </button>
            </div>

            <div id="editor-${ch.id}" class="hidden mt-4 pt-4 border-t border-gray-700">
                <textarea onchange="updateChapterBody('${ch.id}', this.value)" 
                    class="w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm text-gray-300 focus:ring-1 focus:ring-indigo-500 outline-none h-64 leading-relaxed"
                    placeholder="Chapter Content..."
                >${ch.body.replace(/<p>/g, '').replace(/<\/p>/g, '\n').trim()}</textarea>
            </div>
        </div>
        `;
    }).join('');

    lucide.createIcons();
}

function toggleChapterEditor(id) {
    const el = document.getElementById(`editor-${id}`);
    if (el) el.classList.toggle('hidden');
}

function updateChapterTitle(id, val) {
    const ch = currentChapters.find(c => c.id === id);
    if (ch) ch.title = val;
}

function updateChapterBody(id, val) {
    const ch = currentChapters.find(c => c.id === id);
    if (ch) ch.body = val;
}

function removeChapterLocal(id) {
    if (!confirm('Remove this chapter?')) return;
    currentChapters = currentChapters.filter(c => c.id !== id);
    renderChapterCards(stories.find(s => s.id === activeStoryId));
}

function addNewChapter() {
    currentChapters.push({
        title: `Chapter ${currentChapters.length + 1}`,
        body: '',
        id: Math.random().toString(36).substr(2, 9)
    });
    renderChapterCards(stories.find(s => s.id === activeStoryId));
}

async function saveChaptersChanges() {
    if (!activeStoryId) return;
    let constructedContent = '';

    currentChapters.forEach((ch, idx) => {
        const title = ch.title.trim() || `Chapter ${idx + 1}`;
        const rawBody = ch.body;
        const formattedBody = rawBody.includes('<p>') ? rawBody :
            rawBody.split(/\n\s*\n/).map(p => p.trim() ? `<p>${p.trim()}</p>` : '').join('');
        constructedContent += `<h2 class="chapter-title" id="chapter-${idx + 1}">${title}</h2>\n${formattedBody}\n\n`;
    });

    try {
        const response = await fetchWithAuth(`/stories/${activeStoryId}`, {
            method: 'PUT',
            body: JSON.stringify({ fullContent: constructedContent })
        });
        if (response.ok) {
            alert('Chapters updated successfully!');
            fetchStories();
            closeChaptersModal();
        } else {
            alert('Failed to save changes');
        }
    } catch (error) {
        console.error(error);
        alert('Error saving chapters');
    }
}
