
document.addEventListener('DOMContentLoaded', () => {
    fetchStories();

    const user = JSON.parse(localStorage.getItem('adminUser'));
    if (user && user.name) {
        const adminNameEl = document.getElementById('adminName');
        if (adminNameEl) adminNameEl.textContent = user.name;
    }

    const storyForm = document.getElementById('storyForm');
    if (storyForm) storyForm.addEventListener('submit', handleFormSubmit);

    // Price/Discount sync logic
    const priceInput = document.getElementById('price');
    const discountInput = document.getElementById('discount');
    if (priceInput && discountInput) {
        priceInput.addEventListener('input', () => {
            const isPaid = parseFloat(priceInput.value) > 0;
            discountInput.disabled = !isPaid;
            discountInput.parentElement.style.opacity = isPaid ? '1' : '0.5';
        });
    }
});

let stories = [];

// Fetch Stories
async function fetchStories() {
    const tableBody = document.getElementById('storyTableBody');
    try {
        const response = await fetchWithAuth('/stories');
        if (!response.ok) throw new Error('Failed to fetch stories from server');

        stories = await response.json();
        renderTable();
    } catch (error) {
        console.error("Fetch Error:", error);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-red-400 font-medium">Error loading stories. Please refresh.</td></tr>`;
    }
}

// Format Date Utility (No Moment Dependency)
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    } catch (e) {
        return 'N/A';
    }
}

// Render Main Table
function renderTable() {
    const tableBody = document.getElementById('storyTableBody');
    if (!tableBody || !stories) return;

    if (stories.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-12 text-center text-gray-500 font-medium">No stories found. Click "Add New Story".</td></tr>`;
        return;
    }

    try {
        tableBody.innerHTML = stories.map(story => {
            let imgUrl = story.image || 'https://placehold.co/40';
            if (imgUrl && !imgUrl.startsWith('http')) {
                imgUrl = `../${imgUrl}`;
            }

            // SMART CHAPTER COUNT
            const content = story.content || '';
            const chapterCount = (content.match(/<h2/gi) || []).length || (content.trim() ? 1 : 0);

            return `
            <tr class="hover:bg-gray-700/30 transition-colors group">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <img src="${imgUrl}" onerror="this.src='https://placehold.co/40'" class="w-10 h-10 rounded-lg object-cover bg-gray-700 border border-gray-700 shadow-sm">
                        <div class="cursor-pointer" onclick="openChaptersView('${story.id}')">
                            <div class="font-bold text-white group-hover:text-indigo-400 transition-colors">${story.title || 'Untitled'}</div>
                            <div class="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest">${story.language || 'Hindi'}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-gray-400 font-medium">${story.author || 'Sabirkhan'}</td>
                <td class="px-6 py-4">
                    <div class="flex flex-col gap-1.5 items-center">
                        <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
                            ${story.category || 'Story'}
                        </span>
                        <div class="flex items-center gap-1 text-[11px] text-gray-300 font-black bg-gray-900/50 px-2.5 py-0.5 rounded-full border border-gray-700/50">
                            ${chapterCount} CHAPTERS
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-[12px] font-black ${parseFloat(story.price) > 0 ? 'text-green-400' : 'text-blue-300'} uppercase">
                        ${parseFloat(story.price) > 0 ? '₹' + story.price : 'Free'}
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-col items-center gap-1">
                        <div class="flex items-center gap-1 text-xs text-indigo-400">
                            <i data-lucide="eye" class="w-3 h-3"></i>
                            <span class="font-bold">${story.views || 0}</span>
                        </div>
                        <div class="flex items-center gap-1 text-[10px] text-yellow-500">
                            <i data-lucide="star" class="w-2.5 h-2.5 fill-yellow-500"></i>
                            <span>${story.rating || '4.8'}</span>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-gray-500 text-[10px] text-center font-black">
                    ${formatDate(story.created_at || story.date)}
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button onclick="editStory('${story.id}')" class="p-2 bg-gray-700 hover:bg-indigo-600 text-gray-300 hover:text-white rounded-lg transition-transform hover:scale-105">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteStory('${story.id}')" class="p-2 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition-transform hover:scale-105">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    } catch (err) {
        console.error("Render Error:", err);
        tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-red-400">Error rendering data.</td></tr>`;
    }

    if (window.lucide) lucide.createIcons();
}

// MODAL & FORM LOGIC
function openModal(isEdit = false) {
    const modal = document.getElementById('storyModal');
    if (modal) modal.classList.remove('hidden');
    if (!isEdit) {
        document.getElementById('storyForm').reset();
        document.getElementById('storyId').value = '';
        document.getElementById('imagePreview').classList.add('hidden');
        document.getElementById('chaptersContainer').innerHTML = '';
        addChapterField('Chapter 1', '');
    }
}

function closeModal() {
    const modal = document.getElementById('storyModal');
    if (modal) modal.classList.add('hidden');
}

function editStory(id) {
    const story = stories.find(s => s.id === id);
    if (!story) return;

    document.getElementById('storyId').value = id;
    document.getElementById('title').value = story.title;
    document.getElementById('author').value = story.author || '';
    document.getElementById('category').value = story.category || '';
    document.getElementById('language').value = story.language || 'Hindi';
    document.getElementById('imageUrl').value = story.image || '';
    document.getElementById('price').value = story.price || 0;
    document.getElementById('discount').value = story.discount || 0;
    document.getElementById('descriptionInput').value = story.summary || '';
    document.getElementById('youtubeLink').value = story.youtube_link || '';

    const container = document.getElementById('chaptersContainer');
    container.innerHTML = '';

    // Parse Chapters
    const parsedChapters = parseChaptersFromContent(story.content || '');
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
}

function addChapterField(titleValue = '', bodyValue = '') {
    const container = document.getElementById('chaptersContainer');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'p-4 bg-gray-800/40 border border-gray-700/50 rounded-xl relative mb-4';
    div.innerHTML = `
        <button type="button" onclick="this.parentElement.remove()" class="absolute top-2 right-2 text-gray-500 hover:text-red-400 p-2">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
        <div class="space-y-3">
            <input type="text" placeholder="Title..." value="${titleValue}" class="chapter-title-input w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-bold outline-none">
            <textarea placeholder="Content..." rows="6" class="chapter-body-input w-full bg-gray-950/50 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-300 leading-relaxed outline-none">${bodyValue.trim()}</textarea>
        </div>
    `;
    container.appendChild(div);
    if (window.lucide) lucide.createIcons();
}

// SMART PARSER
function decodeEntities(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

function parseChaptersFromContent(content) {
    if (!content) return [];
    const decoded = decodeEntities(content);
    const parser = new DOMParser();
    const doc = parser.parseFromString(decoded, 'text/html');
    const headings = Array.from(doc.querySelectorAll('h2'));

    if (headings.length === 0) return [];

    return headings.map((h2, idx) => {
        let body = "";
        let sibling = h2.nextSibling;
        while (sibling && sibling.nodeName !== 'H2') {
            body += (sibling.nodeType === 1) ? sibling.outerHTML : (sibling.textContent || "");
            sibling = sibling.nextSibling;
        }
        return {
            title: h2.textContent.trim() || `Chapter ${idx + 1}`,
            body: body.trim(),
            id: Math.random().toString(36).substr(2, 9)
        };
    });
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
            const uploadData = await uploadRes.json();
            imageUrl = uploadData.url;
        }

        const chapterDivs = document.querySelectorAll('#chaptersContainer > div');
        let constructedContent = '';
        chapterDivs.forEach((div, idx) => {
            const title = div.querySelector('.chapter-title-input').value.trim() || `Chapter ${idx + 1}`;
            const rawBody = div.querySelector('.chapter-body-input').value.trim();
            const formattedBody = rawBody.startsWith('<p>') ? rawBody :
                rawBody.split(/\n\s*\n/).map(p => p.trim() ? `<p>${p.trim()}</p>` : '').join('');

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
            youtubeLink: document.getElementById('youtubeLink').value,
            price: parseFloat(document.getElementById('price').value) || 0,
            discount: parseFloat(document.getElementById('discount').value) || 0,
            status: 'published'
        };

        const response = await fetchWithAuth(isEdit ? `/stories/${id}` : '/stories', {
            method: isEdit ? 'PUT' : 'POST',
            body: JSON.stringify(storyData)
        });

        if (response.ok) {
            closeModal();
            fetchStories();
        } else {
            const data = await response.json();
            alert(data.message || 'Save failed');
        }
    } catch (error) {
        console.error(error);
        alert('An error occurred while saving.');
    } finally {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
}

// CHAPTERS MODAL VIEW
let activeStoryId = null;
let currentChapters = [];

async function openChaptersView(id) {
    activeStoryId = id;
    const story = stories.find(s => s.id === id);
    if (!story) return;

    const modal = document.getElementById('chaptersModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.getElementById('chaptersModalTitle').textContent = `Manage: ${story.title}`;
        currentChapters = parseChaptersFromContent(story.content || '');
        renderChapterCards(story);
    }
}

function closeChaptersModal() {
    const modal = document.getElementById('chaptersModal');
    if (modal) modal.classList.add('hidden');
    activeStoryId = null;
}

function renderChapterCards(story) {
    const container = document.getElementById('chaptersList');
    if (!container) return;

    if (currentChapters.length === 0) {
        container.innerHTML = `<div class="text-center py-12 text-gray-500 font-medium">No chapters found.</div>`;
        return;
    }

    container.innerHTML = currentChapters.map((ch, idx) => {
        const wordCount = (ch.body.replace(/<[^>]*>/g, '').trim().split(/\s+/).length) || 0;
        const readTime = Math.max(1, Math.ceil(wordCount / 200));

        return `
        <div class="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg mb-4 relative group">
            <button onclick="removeChapterLocal('${ch.id}')" class="absolute top-4 right-4 text-gray-500 hover:text-red-400 p-2">
                <i data-lucide="trash-2" class="w-5 h-5"></i>
            </button>
            <div class="flex items-start gap-4 mb-4">
                <div class="bg-indigo-500/10 text-indigo-400 w-10 h-10 rounded-lg flex items-center justify-center font-black border border-indigo-500/20">${idx + 1}</div>
                <div class="flex-1">
                    <input type="text" onchange="updateChapterTitle('${ch.id}', this.value)" value="${ch.title}" class="bg-transparent border-none text-white font-black text-lg w-full focus:ring-0 p-0">
                    <div class="flex items-center gap-3 text-[10px] text-gray-400 mt-1 font-black uppercase tracking-widest">
                        <span class="flex items-center gap-1"><i data-lucide="eye" class="w-3 h-3"></i>${story.views || 0}</span>
                        <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i>${readTime} MIN</span>
                    </div>
                </div>
            </div>
            <div class="flex justify-between items-center bg-gray-900/40 p-3 rounded-lg border border-gray-700/30">
                <span class="text-[10px] text-indigo-400 font-black tracking-widest">REVIEWS: ${story.reviewCount || 0}</span>
                <button onclick="toggleChapterEditor('${ch.id}')" class="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-black transition-all">EDIT CONTENT</button>
            </div>
            <div id="editor-${ch.id}" class="hidden mt-4 pt-4 border-t border-gray-700">
                <textarea onchange="updateChapterBody('${ch.id}', this.value)" class="w-full bg-gray-950 border border-gray-800 rounded-lg p-4 text-sm text-gray-300 h-64 outline-none focus:border-indigo-500/30 font-inter">${ch.body.replace(/<p>/g, '').replace(/<\/p>/g, '\n').trim()}</textarea>
            </div>
        </div>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
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
    if (!confirm('Remove this chapter card?')) return;
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
    let content = '';
    currentChapters.forEach((ch, idx) => {
        const body = ch.body.includes('<p>') ? ch.body :
            ch.body.split(/\n\s*\n/).map(p => p.trim() ? `<p>${p.trim()}</p>` : '').join('');
        content += `<h2 class="chapter-title" id="chapter-${idx + 1}">${ch.title}</h2>\n${body}\n\n`;
    });

    try {
        const response = await fetchWithAuth(`/stories/${activeStoryId}`, {
            method: 'PUT',
            body: JSON.stringify({ fullContent: content })
        });
        if (response.ok) {
            alert('Chapters Saved!');
            fetchStories();
            closeChaptersModal();
        } else alert('Save failed');
    } catch (e) { alert('An error occurred.'); }
}

async function deleteStory(id) {
    if (!confirm('Are you sure?')) return;
    const response = await fetchWithAuth(`/stories/${id}`, { method: 'DELETE' });
    if (response.ok) fetchStories();
}
