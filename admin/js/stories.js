
document.addEventListener('DOMContentLoaded', () => {
    fetchStories();

    const user = JSON.parse(localStorage.getItem('adminUser'));
    if (user && user.name) {
        const adminNameEl = document.getElementById('adminName');
        if (adminNameEl) adminNameEl.textContent = user.name;
    }

    const storyForm = document.getElementById('storyForm');
    if (storyForm) storyForm.addEventListener('submit', handleFormSubmit);

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

// Fetch Stories (Lightweight)
async function fetchStories() {
    const tableBody = document.getElementById('storyTableBody');
    try {
        const response = await fetchWithAuth('/stories');
        if (!response.ok) throw new Error('Fetch failed');

        stories = await response.json();
        renderTable();
    } catch (error) {
        console.error(error);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-red-400 font-bold">Error loading stories. Please refresh.</td></tr>`;
    }
}

// Render Table
function renderTable() {
    const tableBody = document.getElementById('storyTableBody');
    const mobileBody = document.getElementById('storyMobileBody');
    if (!tableBody || !mobileBody || !stories) return;

    if (stories.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="px-6 py-12 text-center text-gray-500 font-medium">No stories found.</td></tr>`;
        mobileBody.innerHTML = `<div class="py-12 text-center text-gray-500">No stories found.</div>`;
        return;
    }

    tableBody.innerHTML = stories.map(story => {
        let imgUrl = story.image || 'https://placehold.co/40';
        if (imgUrl && !imgUrl.startsWith('http')) imgUrl = `../${imgUrl}`;

        return `
        <tr class="hover:bg-gray-700/30 transition-colors group">
            <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                    <img src="${imgUrl}" onerror="this.src='https://placehold.co/40'" class="w-10 h-10 rounded-lg object-cover bg-gray-700 border border-gray-700 shadow-sm">
                    <div class="cursor-pointer" onclick="openChaptersView('${story.id}')">
                        <div class="font-bold text-white group-hover:text-indigo-400 transition-colors">${story.title || 'Untitled'}</div>
                        <div class="text-[10px] text-indigo-400 font-black uppercase tracking-widest">${story.language || 'Hindi'}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 text-gray-400 font-medium">${story.author || "Draft"} </td>
            <td class="px-6 py-4 text-center">
                <span class="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    ${story.category || 'Story'}
                </span>
                <div class="text-[10px] text-indigo-300 font-black mt-1 cursor-pointer hover:text-white transition-colors underline" onclick="openChaptersView('${story.id}')">
                    MANAGE CHAPTERS
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="text-[12px] font-black ${parseFloat(story.price) > 0 ? 'text-green-400' : 'text-blue-300'} uppercase">
                    ${parseFloat(story.price) > 0 ? '₹' + story.price : 'Free'}
                </div>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-1.5 text-xs text-gray-300 bg-gray-800/50 py-1 rounded-lg border border-gray-700/30">
                    <i data-lucide="eye" class="w-3.5 h-3.5 text-indigo-500"></i>
                    <span class="font-bold">${story.views || 0}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-gray-500 text-[10px] text-center font-bold">
                ${new Date(story.created_at || story.date).toLocaleDateString('en-GB')}
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onclick="editStory('${story.id}')" class="p-2 bg-gray-700/50 hover:bg-indigo-600 text-gray-300 hover:text-white rounded-lg transition-all" title="Edit">
                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteStory('${story.id}')" class="p-2 bg-gray-700/50 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition-all" title="Delete">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');

    mobileBody.innerHTML = stories.map(story => {
        let imgUrl = story.image || 'https://placehold.co/100';
        if (imgUrl && !imgUrl.startsWith('http')) imgUrl = `../${imgUrl}`;

        // If content is not loaded (optimized list), we default to 1 Part.
        // It will be correctly counted in the "Manage Chapters" view where we fetch full details.
        // Use parts_count from backend if available, else fall back to basic calculation
        const partsCount = story.parts_count !== undefined ? story.parts_count : 1;
        const partsLabel = partsCount === 1 ? 'Part' : 'Parts';

        let ratingHtml = '';
        if (story.rating && story.rating > 0) {
            ratingHtml = `
                <div class="absolute top-0 right-0 bg-[#005f73] text-white text-[10px] font-bold px-1.5 py-1 rounded-tr-lg rounded-bl-lg flex items-center gap-0.5 z-10 shadow">
                    ${story.rating.toFixed(1)} <span>★</span>
                </div>
            `;
        } else {
            ratingHtml = `
                <div class="absolute top-0 right-0 bg-gray-700/80 backdrop-blur-sm text-gray-300 text-[9px] font-bold px-1.5 py-1 rounded-tr-lg rounded-bl-lg flex items-center z-10">
                    NEW
                </div>
            `;
        }

        return `
        <div class="bg-gray-800 rounded-xl p-3 flex gap-4 relative overflow-visible shadow-lg border border-gray-700">
            <!-- Left: Image Portrait -->
            <div class="relative w-[85px] h-[120px] flex-shrink-0 rounded-lg overflow-hidden bg-gray-900 border border-gray-700 cursor-pointer" onclick="openChaptersView('${story.id}')">
                <img src="${imgUrl}" onerror="this.src='https://placehold.co/100'" class="w-full h-full object-cover">
                <!-- Top Right Rating Badge -->
                ${ratingHtml}
            </div>
            
            <!-- Right: Details -->
            <div class="flex-1 flex flex-col justify-start py-0.5">
                <div class="flex justify-between items-start gap-2 h-7 relative z-20">
                    <h3 class="text-white font-bold text-base leading-tight line-clamp-2 cursor-pointer pr-5" onclick="openChaptersView('${story.id}')">
                        ${story.title || 'Untitled'}
                    </h3>
                    
                    <!-- 3-Dot Menu -->
                    <div class="absolute -top-1 -right-2 dropdown-container">
                        <button onclick="toggleMobileMenu(event, '${story.id}')" class="text-gray-400 hover:text-white p-2">
                            <i data-lucide="more-vertical" class="w-5 h-5"></i>
                        </button>
                        <!-- Dropdown Content -->
                        <div id="dropdown-${story.id}" class="hidden absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 w-40 z-50">
                            <button onclick="openChaptersView('${story.id}')" class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2">
                                <i data-lucide="layers" class="w-4 h-4 text-indigo-400"></i> Chapters
                            </button>
                            <button onclick="editStory('${story.id}')" class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2">
                                <i data-lucide="edit-2" class="w-4 h-4 text-blue-400"></i> Edit
                            </button>
                            <button onclick="deleteStory('${story.id}')" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-700 flex items-center gap-2">
                                <i data-lucide="trash-2" class="w-4 h-4"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Parts Badge -->
                <div class="mt-4 text-left">
                    <span class="inline-flex items-center gap-1.5 bg-gray-700 text-gray-200 text-xs font-semibold px-2.5 py-1 rounded">
                        <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
                        ${partsCount} ${partsLabel}
                    </span>
                </div>
                
                <!-- Views -->
                <div class="mt-auto pt-2 text-gray-400 text-xs font-medium">
                    ${story.views || 0} views.
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
window.toggleMobileMenu = function (e, id) {
    e.stopPropagation();
    const target = document.getElementById(`dropdown-${id}`);
    const isHidden = target.classList.contains('hidden');

    document.querySelectorAll('[id^="dropdown-"]').forEach(el => el.classList.add('hidden'));

    if (isHidden) {
        target.classList.remove('hidden');
    }
};

// Parse Chapters
function parseChaptersFromContent(content) {
    if (!content) return [];

    // Auto-decode common HTML entities just in case
    const decoded = content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

    const parser = new DOMParser();
    const doc = parser.parseFromString(decoded, 'text/html');
    const headings = Array.from(doc.querySelectorAll('h2'));

    if (headings.length === 0) {
        if (decoded.trim()) return [{ title: 'Main Story', body: decoded.trim(), id: 'default' }];
        return [];
    }

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

// Edit Story (On-Demand Fetch)
async function editStory(id) {
    try {
        const response = await fetchWithAuth(`/stories/${id}`);
        if (!response.ok) throw new Error('Details failed');
        const story = await response.json();

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

        document.getElementById('modalTitle').textContent = 'Edit Story: ' + story.title;
        openModal(true);
    } catch (err) { alert('Failed to load story details.'); }
}

function addChapterField(titleValue = '', bodyValue = '') {
    const container = document.getElementById('chaptersContainer');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl mb-4 relative';
    div.innerHTML = `
        <button type="button" onclick="this.parentElement.remove()" class="absolute top-2 right-2 text-gray-500 hover:text-red-400 p-2"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        <input type="text" placeholder="Title..." value="${titleValue}" class="chapter-title-input w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-bold outline-none mb-3">
        <textarea placeholder="Content..." rows="6" class="chapter-body-input w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-3 text-sm text-gray-300 leading-relaxed outline-none">${bodyValue.trim()}</textarea>
    `;
    container.appendChild(div);
    if (window.lucide) lucide.createIcons();
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
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
        let fullHtml = '';
        chapterDivs.forEach((div, idx) => {
            const title = div.querySelector('.chapter-title-input').value.trim() || `Chapter ${idx + 1}`;
            const body = div.querySelector('.chapter-body-input').value.trim();
            const formattedBody = body.startsWith('<p>') ? body : body.split(/\n\s*\n/).map(p => p.trim() ? `<p>${p.trim()}</p>` : '').join('');
            fullHtml += `<h2 class="chapter-title">${title}</h2>\n${formattedBody}\n\n`;
        });

        const storyData = { title: e.target.title.value, author: e.target.author.value, category: e.target.category.value, language: e.target.language.value, coverImage: imageUrl, summary: document.getElementById('descriptionInput').value, fullContent: fullHtml, youtubeLink: e.target.youtubeLink.value, price: parseFloat(e.target.price.value) || 0, discount: parseFloat(e.target.discount.value) || 0, status: 'published' };

        const res = await fetchWithAuth(isEdit ? `/stories/${id}` : '/stories', { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(storyData) });
        if (res.ok) { closeModal(); fetchStories(); }
        else { const d = await res.json(); alert(d.message || 'Error saving story'); }
    } catch (e) { alert('An error occurred.'); }
    finally { submitBtn.textContent = originalText; submitBtn.disabled = false; }
}

// Chapter Modal Logic (On-Demand Fetch)
let activeStoryId = null;
let currentChapters = [];
let chapterStats = [];

async function openChaptersView(id) {
    activeStoryId = id;
    try {
        const res = await fetchWithAuth(`/stories/${id}`);
        const story = await res.json();

        // Fetch Stats
        const statsRes = await fetchWithAuth(`/stories/${id}/chapters/stats`);
        if (statsRes.ok) {
            chapterStats = await statsRes.json();
        } else {
            chapterStats = [];
        }

        const modal = document.getElementById('chaptersModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('chaptersModalTitle').textContent = `Manage: ${story.title}`;
            currentChapters = parseChaptersFromContent(story.content || '');
            renderChapterCards(story);
        }
    } catch (e) { alert('Failed to load chapters.'); }
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
        container.innerHTML = `<div class="text-center py-12 text-gray-500 font-bold">No chapters detected.</div>`;
        return;
    }

    container.innerHTML = currentChapters.map((ch, idx) => {
        const wc = (ch.body.replace(/<[^>]*>/g, '').trim().split(/\s+/).length) || 0;
        const rt = Math.max(1, Math.ceil(wc / 200));

        // GET STATS FROM NEW STRUCTURE
        const vData = (chapterStats && chapterStats.views) || {};
        const rData = (chapterStats && chapterStats.ratings && chapterStats.ratings[idx]) || { total: 0, count: 0 };

        const chViews = vData[`ch_${idx}`] || 0;
        const chRating = rData.count > 0 ? (rData.total / rData.count).toFixed(1) : 0;
        const chRateCount = rData.count || 0;
        const chDate = story.created_at ? new Date(story.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

        return `
        <div class="relative bg-[#1a1a1a] border-b border-gray-800 p-6 group hover:bg-gray-800/20 transition-all duration-300">
            <!-- Line 1: Title & Menu -->
            <div class="flex items-center justify-between mb-2">
                <input type="text" onchange="updateChapterTitle('${ch.id}', this.value)" value="${ch.title}" 
                    class="bg-transparent border-none text-white font-bold text-xl w-full focus:ring-0 p-0 leading-tight">
                <div class="relative flex items-center gap-2">
                    <button onclick="toggleChapterEditor('${ch.id}')" class="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                        <i data-lucide="edit-3" class="w-5 h-5"></i>
                    </button>
                    <button onclick="removeChapterLocal('${ch.id}')" class="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>

            <!-- Line 2: Stats (Views & Rating) -->
            <div class="flex items-center gap-5 text-gray-500 text-sm mb-2">
                <div class="flex items-center gap-1.5 font-medium">
                    <i data-lucide="eye" class="w-5 h-5 text-gray-400"></i>
                    <span>${chViews}</span>
                </div>
                <div class="flex items-center gap-1.5 font-medium">
                    <i data-lucide="star" class="w-5 h-5 text-amber-500 fill-amber-500"></i>
                    <span>${chRating}</span>
                </div>
                <div class="ml-auto text-[10px] uppercase font-black tracking-widest text-indigo-400 opacity-60">
                    ${wc} Words / ${rt} min
                </div>
            </div>

            <!-- Line 3: Last Update -->
            <div class="text-gray-400 text-xs font-medium">
                છેલ્લો સુધારો - ${chDate}
            </div>

            <!-- Modern Inner Editor (Hidden by default) -->
            <div id="editor-${ch.id}" class="hidden mt-4 pt-4 border-t border-gray-100">
                <div class="bg-black/20 rounded-2xl p-4 border border-gray-200">
                    <textarea onchange="updateChapterBody('${ch.id}', this.value)" 
                        placeholder="Chapter content..."
                        class="w-full bg-transparent border-none text-gray-700 h-[400px] outline-none text-lg font-serif leading-relaxed placeholder:text-gray-300">${ch.body.replace(/<p>/g, '').replace(/<\/p>/g, '\n').trim()}</textarea>
                </div>
                <div class="flex justify-end mt-3">
                     <button onclick="toggleChapterEditor('${ch.id}')" class="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-md uppercase tracking-widest">Finish Editing</button>
                </div>
            </div>
        </div>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
}

function toggleChapterEditor(id) { const el = document.getElementById(`editor-${id}`); if (el) el.classList.toggle('hidden'); }
function updateChapterTitle(id, val) { const ch = currentChapters.find(c => c.id === id); if (ch) ch.title = val; }
function updateChapterBody(id, val) { const ch = currentChapters.find(c => c.id === id); if (ch) ch.body = val; }
function removeChapterLocal(id) { if (!confirm('Remove?')) return; currentChapters = currentChapters.filter(c => c.id !== id); renderChapterCards(stories.find(s => s.id === activeStoryId)); }
function addNewChapter() { currentChapters.push({ title: `Chapter ${currentChapters.length + 1}`, body: '', id: Math.random().toString(36).substr(2, 9) }); renderChapterCards(stories.find(s => s.id === activeStoryId)); }

async function saveChaptersChanges() {
    if (!activeStoryId) return;
    let html = '';
    currentChapters.forEach((ch, idx) => {
        const b = ch.body.includes('<p>') ? ch.body : ch.body.split(/\n\s*\n/).map(p => p.trim() ? `<p>${p.trim()}</p>` : '').join('');
        html += `<h2>${ch.title}</h2>\n${b}\n\n`;
    });
    try {
        const res = await fetchWithAuth(`/stories/${activeStoryId}`, { method: 'PUT', body: JSON.stringify({ fullContent: html }) });
        if (res.ok) { alert('Updated!'); fetchStories(); closeChaptersModal(); }
        else alert('Error');
    } catch (e) { alert('Error'); }
}

async function deleteStory(id) {
    if (!confirm('Are you sure?')) return;
    const res = await fetchWithAuth(`/stories/${id}`, { method: 'DELETE' });
    if (res.ok) fetchStories();
}

function openModal(isEdit = false) {
    const modal = document.getElementById('storyModal');
    if (modal) modal.classList.remove('hidden');
    if (!isEdit) {
        document.getElementById('storyForm').reset();
        document.getElementById('storyId').value = '';
        document.getElementById('chaptersContainer').innerHTML = '';
        addChapterField('Chapter 1', '');
    }
}

function closeModal() {
    const modal = document.getElementById('storyModal');
    if (modal) modal.classList.add('hidden');
}
