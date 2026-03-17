
document.addEventListener('DOMContentLoaded', () => {
    fetchAudio();

    const adminNameEl = document.getElementById('adminName');
    const user = JSON.parse(localStorage.getItem('adminUser'));
    if (user && user.name && adminNameEl) adminNameEl.textContent = user.name;

    const audioForm = document.getElementById('audioForm');
    if (audioForm) audioForm.addEventListener('submit', handleFormSubmit);
});

let audioStories = [];

// Fetch All Audio Stories
async function fetchAudio() {
    const tableBody = document.getElementById('audioTableBody');
    try {
        const res = await fetchWithAuth('/audio');
        if (!res.ok) throw new Error('Fetch failed');
        audioStories = await res.json();
        renderTable();
    } catch (error) {
        console.error(error);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-red-400 font-bold">Error loading audio stories.</td></tr>`;
    }
}

// Render Table
function renderTable() {
    const tableBody = document.getElementById('audioTableBody');
    if (!tableBody) return;

    if (audioStories.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="px-6 py-12 text-center text-gray-500 font-medium">No audio stories found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = audioStories.map(story => {
        let imgUrl = story.image || 'https://placehold.co/100';
        if (imgUrl && !imgUrl.startsWith('http')) imgUrl = `../${imgUrl}`;

        return `
        <tr class="hover:bg-gray-700/30 transition-colors group">
            <td class="px-6 py-4">
                <div class="flex items-center gap-4">
                    <img src="${imgUrl}" class="w-14 h-14 rounded-2xl object-cover border-2 border-gray-700/50 shadow-xl group-hover:border-indigo-500/50 transition-all">
                    <div class="min-w-0">
                        <div class="font-bold text-white group-hover:text-indigo-400 transition-colors truncate text-base">${story.title}</div>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[9px] text-indigo-400 font-extrabold uppercase tracking-tighter bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">${story.language || 'Hindi'}</span>
                            <span class="text-[9px] ${parseFloat(story.price) > 0 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'} font-extrabold uppercase tracking-tighter px-1.5 py-0.5 rounded border">
                                ${parseFloat(story.price) > 0 ? 'PREMIUM' : 'FREE'}
                            </span>
                        </div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="flex flex-col gap-1.5">
                    <div class="flex items-center gap-2 text-xs font-black text-gray-400">
                         <i data-lucide="layers" class="w-3.5 h-3.5 text-gray-500"></i>
                         ${story.episodes ? story.episodes.length : 0} CHAPTERS
                    </div>
                    <button onclick="openEpisodesModal('${story.id}')" class="text-[10px] font-black tracking-widest text-indigo-400 hover:text-white transition-all text-left uppercase flex items-center gap-1 group/btn">
                        <span>MANAGE PARTS</span>
                        <i data-lucide="chevron-right" class="w-3 h-3 group-hover/btn:translate-x-1 transition-transform"></i>
                    </button>
                </div>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="inline-flex items-center gap-1 text-sm font-black text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                    <i data-lucide="star" class="w-4 h-4 fill-amber-400"></i>
                    ${parseFloat(story.rating || 0).toFixed(1)}
                </div>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-1.5 text-xs text-gray-200 bg-gray-900/50 py-2 px-4 rounded-xl border border-gray-700/30 font-bold shadow-inner">
                    <i data-lucide="activity" class="w-4 h-4 text-emerald-500"></i>
                    <span>${story.views || 0} <span class="text-[10px] text-gray-500 ml-0.5 font-black uppercase">Hits</span></span>
                </div>
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button onclick="editAudio('${story.id}')" title="Edit Story" class="p-2.5 bg-gray-800 hover:bg-indigo-600 text-gray-400 hover:text-white rounded-xl transition-all border border-gray-700 hover:border-indigo-400 shadow-lg">
                        <i data-lucide="edit-3" class="w-4.5 h-4.5"></i>
                    </button>
                    <button onclick="deleteAudio('${story.id}')" title="Delete Story" class="p-2.5 bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white rounded-xl transition-all border border-gray-700 hover:border-red-400 shadow-lg">
                        <i data-lucide="trash-2" class="w-4.5 h-4.5"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    }).join('');

    if (window.lucide) lucide.createIcons();
}

// Preview Image helper
function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    const placeholder = document.getElementById('imagePlaceholder');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.classList.remove('hidden');
            if (placeholder) placeholder.classList.add('hidden');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Add Episode Field (Like stories chapters field)
function addEpisodeField(titleValue = '', duration = '', url = '') {
    const container = document.getElementById('episodesFieldContainer');
    const placeholder = document.getElementById('noEpisodesPlaceholder');
    if (placeholder) placeholder.classList.add('hidden');

    const div = document.createElement('div');
    div.className = 'p-4 bg-gray-900 border border-gray-700 rounded-2xl relative group';
    
    // Check if it's existing or new
    const isExisting = !!url;

    div.innerHTML = `
        <button type="button" onclick="this.parentElement.remove()" class="absolute top-2 right-2 text-gray-500 hover:text-red-400 p-2">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Part Title</label>
                <input type="text" value="${titleValue}" placeholder="Part 1: The Beginning" 
                    class="ep-title w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Audio File</label>
                <div class="flex items-center gap-3">
                    <input type="file" accept="audio/*" onchange="handlePartFileChange(this)"
                        class="ep-file hidden">
                    <button type="button" onclick="this.previousElementSibling.click()" 
                        class="flex-1 px-4 py-2 bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl text-xs text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-all truncate">
                        ${url ? 'Change Part Audio' : 'Upload Part Audio'}
                    </button>
                    ${url ? `<span class="text-[10px] text-green-500 font-bold uppercase">Stored</span>` : ''}
                </div>
                <input type="hidden" class="ep-url" value="${url}">
                <input type="hidden" class="ep-duration" value="${duration}">
                <p class="ep-duration-label text-[10px] text-gray-500 mt-1 ml-1">${duration ? 'Duration: ' + duration : ''}</p>
            </div>
        </div>
    `;
    container.appendChild(div);
    if (window.lucide) lucide.createIcons();
}

async function handlePartFileChange(input) {
    const btn = input.nextElementSibling;
    const durationInput = input.closest('div').querySelector('.ep-duration');
    const durationLabel = input.closest('div').querySelector('.ep-duration-label');

    if (input.files[0]) {
        btn.textContent = input.files[0].name;
        btn.classList.remove('border-dashed');
        btn.classList.add('border-indigo-500/50', 'text-indigo-400');
        
        // Get duration
        try {
            const duration = await getAudioDuration(input.files[0]);
            durationInput.value = duration;
            durationLabel.textContent = `Duration: ${duration}`;
        } catch (e) { console.error(e); }
    }
}

// Get Audio Duration helper
function getAudioDuration(file) {
    return new Promise((resolve) => {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        
        const finish = (durationSecs) => {
            window.URL.revokeObjectURL(audio.src);
            if (!durationSecs || isNaN(durationSecs) || durationSecs === Infinity) {
                return resolve('');
            }
            const hc = Math.floor(durationSecs / 3600);
            const rc = durationSecs % 3600;
            const minutes = Math.floor(rc / 60);
            const seconds = Math.floor(rc % 60);
            
            if (hc > 0) {
                resolve(`${hc}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
            } else {
                resolve(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
            }
        };

        audio.onloadedmetadata = function () {
            if (audio.duration === Infinity) {
                audio.currentTime = Number.MAX_SAFE_INTEGER;
                audio.ontimeupdate = function () {
                    audio.ontimeupdate = null;
                    finish(audio.duration);
                    audio.currentTime = 0;
                };
            } else {
                finish(audio.duration);
            }
        };
        
        audio.onerror = function() {
            resolve('');
        };
        
        audio.src = URL.createObjectURL(file);
    });
}

// Edit Audio
async function editAudio(id) {
    try {
        const res = await fetchWithAuth(`/audio/${id}`);
        const story = await res.json();

        document.getElementById('audioId').value = id;
        document.getElementById('title').value = story.title;
        document.getElementById('author').value = story.author || '';
        document.getElementById('category').value = story.category || '';
        document.getElementById('language').value = story.language || 'Hindi';
        document.getElementById('imageUrl').value = story.image || '';
        document.getElementById('description').value = story.description || '';
        document.getElementById('price').value = story.price || 0;
        document.getElementById('discount').value = story.discount || 0;

        const preview = document.getElementById('imagePreview');
        const placeholder = document.getElementById('imagePlaceholder');
        if (story.image) {
            const imgUrl = story.image.startsWith('http') ? story.image : `../${story.image}`;
            preview.src = imgUrl;
            preview.classList.remove('hidden');
            if (placeholder) placeholder.classList.add('hidden');
        } else {
            preview.classList.add('hidden');
            if (placeholder) placeholder.classList.remove('hidden');
        }

        // Populate Episodes
        const container = document.getElementById('episodesFieldContainer');
        container.innerHTML = '';
        if (story.episodes && story.episodes.length > 0) {
            story.episodes.forEach(ep => addEpisodeField(ep.title, ep.duration, ep.file_url));
        } else {
            // If legacy audio, add it as Part 1
            addEpisodeField(story.title, story.duration, story.file_url);
        }

        document.getElementById('modalTitle').textContent = 'Edit Audio Story';
        openModal(true);
    } catch (e) {
        console.error(e);
        alert('Failed to load details.');
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
        const id = document.getElementById('audioId').value;
        const isEdit = !!id;
        
        let coverUrl = document.getElementById('imageUrl').value;
        const coverFile = document.getElementById('imageFile').files[0];

        if (coverFile) {
            const formData = new FormData();
            formData.append('file', coverFile);
            const uploadRes = await fetchWithAuth('/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            coverUrl = uploadData.url;
        }

        // Gather Episode Data
        const epContainers = document.querySelectorAll('#episodesFieldContainer > div');
        if (epContainers.length === 0) {
            alert('Please add at least one part.');
            btn.textContent = originalText;
            btn.disabled = false;
            return;
        }

        const episodes = [];
        for (const cont of epContainers) {
            const title = cont.querySelector('.ep-title').value;
            const fileInput = cont.querySelector('.ep-file');
            const urlInput = cont.querySelector('.ep-url');
            const duration = cont.querySelector('.ep-duration').value;

            let finalUrl = urlInput.value;
            if (fileInput.files[0]) {
                const fd = new FormData();
                fd.append('file', fileInput.files[0]);
                const upRes = await fetchWithAuth('/upload', { method: 'POST', body: fd });
                const upData = await upRes.json();
                finalUrl = upData.url;
            }

            episodes.push({ title, file_url: finalUrl, duration });
        }

        // For Legacy Support (set first episode as main story file)
        const firstEp = episodes[0];

        const audioData = {
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            category: document.getElementById('category').value,
            language: document.getElementById('language').value,
            image: coverUrl,
            description: document.getElementById('description').value,
            price: parseFloat(document.getElementById('price').value) || 0,
            discount: parseFloat(document.getElementById('discount').value) || 0,
            file_url: firstEp.file_url, // Legacy link
            duration: firstEp.duration,   // Legacy link
            episodes: episodes // NEW: List of all parts
        };

        const res = await fetchWithAuth(isEdit ? `/audio/${id}` : '/audio', {
            method: isEdit ? 'PUT' : 'POST',
            body: JSON.stringify(audioData)
        });

        if (res.ok) {
            closeModal();
            fetchAudio();
        } else {
            const data = await res.json();
            alert(data.message || 'Failed to save.');
        }

    } catch (e) {
        console.error(e);
        alert('An error occurred.');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function deleteAudio(id) {
    if (!confirm('Are you sure you want to delete this audio story? All parts will be removed.')) return;
    try {
        const res = await fetchWithAuth(`/audio/${id}`, { method: 'DELETE' });
        if (res.ok) fetchAudio();
    } catch (e) { alert('Error deleting.'); }
}

function openModal(isEdit = false) {
    document.getElementById('audioModal').classList.remove('hidden');
    if (!isEdit) {
        document.getElementById('audioForm').reset();
        document.getElementById('audioId').value = '';
        document.getElementById('modalTitle').textContent = 'Add New Audio Story';
        document.getElementById('imagePreview').classList.add('hidden');
        document.getElementById('imagePlaceholder').classList.remove('hidden');
        document.getElementById('episodesFieldContainer').innerHTML = '';
        addEpisodeField('Part 1', '', ''); // Default first part
    }
}

function closeModal() {
    document.getElementById('audioModal').classList.add('hidden');
}

// ---------------- EPISODES MODAL (Dedicated) ----------------
let activeAudioId = null;

async function openEpisodesModal(id) {
    activeAudioId = id;
    const modal = document.getElementById('episodesModal');
    const container = document.getElementById('episodesList');
    modal.classList.remove('hidden');
    container.innerHTML = '<p class="text-center text-gray-500 py-10 font-bold">Loading parts...</p>';

    try {
        const res = await fetchWithAuth(`/audio/${id}`);
        const story = await res.json();
        document.getElementById('episodesModalTitle').textContent = `Manage Parts: ${story.title}`;
        
        if (!story.episodes || story.episodes.length === 0) {
            container.innerHTML = `<div class="text-center py-12 text-gray-500 font-bold">No parts added yet. Use the button above to add the first part.</div>`;
            return;
        }

        renderEpisodeCards(story.episodes);

    } catch (e) {
        container.innerHTML = '<p class="text-center text-red-400 py-10">Error loading parts.</p>';
    }
}

function renderEpisodeCards(episodes) {
    const container = document.getElementById('episodesList');
    container.innerHTML = episodes.map((ep, idx) => `
        <div class="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-3xl p-6 relative group transition-all hover:bg-gray-800/80 hover:border-indigo-500/40 hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-indigo-500/10">
            <div class="flex items-center justify-between mb-5">
                <div class="flex items-center gap-4">
                    <div class="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-500/20">
                        ${idx + 1}
                    </div>
                    <div>
                        <h4 class="text-white font-black text-lg tracking-tight uppercase">${ep.title}</h4>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="text-[9px] text-indigo-400 font-extrabold uppercase tracking-widest bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">Episode Part</span>
                            <span class="text-[9px] text-gray-500 font-bold uppercase tracking-widest ml-2">${new Date(ep.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                <button onclick="deleteEpisode('${ep.id}')" class="p-2 text-gray-600 hover:text-red-500 transition-colors bg-gray-900/50 rounded-xl border border-gray-700 hover:border-red-500/50" title="Delete Part">
                    <i data-lucide="trash-2" class="w-4.5 h-4.5"></i>
                </button>
            </div>

            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div class="bg-gray-900/50 p-3 rounded-2xl border border-gray-700/50 text-center">
                    <div class="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Duration</div>
                    <div class="text-sm font-black text-white">${ep.duration || '0:00'}</div>
                </div>
                <div class="bg-gray-900/50 p-3 rounded-2xl border border-gray-700/50 text-center">
                    <div class="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Total Hits</div>
                    <div class="text-sm font-black text-white">${ep.views || 0}</div>
                </div>
                <div class="bg-gray-900/50 p-3 rounded-2xl border border-gray-700/50 text-center">
                    <div class="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Status</div>
                    <div class="text-xs font-black text-emerald-400 uppercase">Live</div>
                </div>
                <div class="bg-gray-900/50 p-3 rounded-2xl border border-gray-700/50 text-center">
                     <div class="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Rating</div>
                    <div class="text-xs font-black text-yellow-500 flex items-center justify-center gap-1">
                        <i data-lucide="star" class="w-3 h-3 fill-yellow-500"></i>
                        ${ep.rating || '5.0'}
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-4">
                <button onclick="playPreview('${ep.file_url}')" class="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 active:scale-95">
                    <i data-lucide="play" class="w-4 h-4 fill-white"></i>
                    Listen Preview
                </button>
                <a href="${ep.file_url.startsWith('http') ? ep.file_url : '/' + ep.file_url}" target="_blank" class="p-3 bg-gray-800 text-gray-400 hover:text-white rounded-2xl border border-gray-700 transition-all hover:bg-gray-700" title="Direct Audio Link">
                    <i data-lucide="external-link" class="w-5 h-5"></i>
                </a>
            </div>
        </div>
    `).join('');
    if (window.lucide) lucide.createIcons();
}

function playPreview(url) {
    const audioUrl = url.startsWith('http') ? url : '/' + url;
    window.open(audioUrl, '_blank');
}

async function addNewEpisodeModal() {
    const title = prompt('Enter Episode Title:');
    if (!title) return;
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.onchange = async () => {
        if (fileInput.files[0]) {
            const file = fileInput.files[0];
            const duration = await getAudioDuration(file);
            
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                const upRes = await fetchWithAuth('/upload', { method: 'POST', body: formData });
                const upData = await upRes.json();
                
                const epData = {
                    audio_story_id: activeAudioId,
                    title,
                    file_url: upData.url,
                    duration
                };
                
                const saveRes = await fetchWithAuth('/audio/episodes', {
                    method: 'POST',
                    body: JSON.stringify(epData)
                });
                
                if (saveRes.ok) openEpisodesModal(activeAudioId);
                else alert('Failed to save episode.');
            } catch (e) { alert('Upload error.'); }
        }
    };
    fileInput.click();
}

async function deleteEpisode(id) {
    if (!confirm('Delete this part?')) return;
    try {
        const res = await fetchWithAuth(`/audio/episodes/${id}`, { method: 'DELETE' });
        if (res.ok) openEpisodesModal(activeAudioId);
    } catch (e) { alert('Delete failed.'); }
}

function closeEpisodesModal() {
    document.getElementById('episodesModal').classList.add('hidden');
    activeAudioId = null;
    fetchAudio(); // Refresh counts
}

function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sb.classList.toggle('-translate-x-full');
    overlay.classList.toggle('hidden');
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('adminUser');
    window.location.href = 'login.html';
}
