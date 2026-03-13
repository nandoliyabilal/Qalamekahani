// reader.js - Logic for Immersive Reading Mode

document.addEventListener('DOMContentLoaded', () => {

    // 1. Get Story ID/Slug from URL
    const params = new URLSearchParams(window.location.search);
    const storyUrlParam = params.get('id');

    // State
    let chapters = [];
    let currentChapterIndex = 0;
    let storyUUID = null; // Store real UUID after fetch

    if (!storyUrlParam) {
        document.body.innerHTML = '<div style="text-align:center; padding:50px;"><h1>No Story Selected</h1><a href="stories.html">Go Back</a></div>';
        return;
    }

    // 2. Fetch Story Content
    fetch(`/api/stories/${storyUrlParam}?increment=false`)
        .then(res => {
            if (!res.ok) throw new Error('Story not found');
            return res.json();
        })
        .then(data => {
            storyUUID = data.id;
            window.currentStoryId = data.id;

            // Updated Meta
            document.title = `${data.title} | Read Qalamekahani`;
            document.getElementById('header-story-title').textContent = data.title;
            document.getElementById('hero-title').textContent = data.title;
            document.getElementById('hero-category').textContent = data.category || 'Story';
            document.getElementById('hero-author').textContent = data.author || 'Sabirkhan Pathan';
            document.getElementById('hero-date').textContent = new Date(data.created_at).toLocaleDateString();

            // Word Count / Read Time
            const words = (data.content || '').split(/\s+/).length;
            document.getElementById('hero-time').textContent = Math.ceil(words / 200) + ' min read';

            // Horror Mode Auto-check
            const cat = (data.category || '').toLowerCase();
            if (cat.includes('horror') || cat.includes('ghost') || cat.includes('mystery')) {
                document.body.classList.add('horror-mode');
                const ht = document.getElementById('horror-toggle');
                if (ht) ht.style.color = '#ff3333';
            }

            // --- CONTENT PARSING ---
            parseChapters(data.content);

            // --- NAVIGATION GENERATION ---
            generateTOC();
            generateMobileTOC();

            // Initial Load
            renderChapter(0);
        })
        .catch(err => {
            console.error(err);
            document.body.innerHTML = `<div style="text-align:center; padding:50px; color:red;"><h1>Error Loading Story</h1><p>${err.message}</p><a href="stories.html">Back to Stories</a></div>`;
        });

    // --- PARSING LOGIC ---
    function parseChapters(html) {
        if (!html) return;

        // Decode HTML entities if any
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        const decoded = txt.value;

        const parser = new DOMParser();
        const doc = parser.parseFromString(decoded, 'text/html');

        // Find all H2s regardless of depth
        const headings = Array.from(doc.querySelectorAll('h2'));

        if (headings.length === 0) {
            chapters.push({ title: "Start", nodes: Array.from(doc.body.childNodes) });
            return;
        }

        headings.forEach((h2, idx) => {
            let chNodes = [h2];
            let curr = h2.nextSibling;
            while (curr && curr.nodeName !== 'H2') {
                chNodes.push(curr);
                curr = curr.nextSibling;
            }
            chapters.push({
                title: h2.textContent.trim() || `Chapter ${idx + 1}`,
                nodes: chNodes
            });
        });
    }

    // --- TOC GENERATION ---
    function generateTOC() {
        const tocList = document.getElementById('toc-list');
        if (!tocList) return;
        tocList.innerHTML = chapters.map((ch, i) => `
            <li class="toc-item">
                <a href="#" class="toc-link" data-index="${i}">
                    ${ch.title.replace(/^Chapter\s+\d+[:\s]*/i, '') || ch.title}
                </a>
            </li>
        `).join('');
    }

    function generateMobileTOC() {
        const mobileMenu = document.getElementById('mobile-chapter-menu');
        if (!mobileMenu) return;
        mobileMenu.innerHTML = chapters.map((ch, i) => `
            <a href="#" class="toc-link" data-index="${i}">
                ${ch.title.replace(/^Chapter\s+\d+[:\s]*/i, '') || ch.title}
            </a>
        `).join('');
    }

    // --- RENDER CHAPTER ---
    function renderChapter(index) {
        if (index < 0 || index >= chapters.length) return;
        currentChapterIndex = index;

        const container = document.getElementById('article-content');
        container.style.opacity = '0';

        setTimeout(() => {
            container.innerHTML = '';
            const ch = chapters[index];

            // Append nodes
            ch.nodes.forEach(n => container.appendChild(n.cloneNode(true)));

            // Animations for focus
            const paras = container.querySelectorAll('p');
            paras.forEach((p, i) => {
                p.style.animation = `fadeInUp 0.8s forwards ${i * 0.05}s`;
                p.style.opacity = '0';
            });

            // Update Active States
            document.querySelectorAll('.toc-link').forEach(l => {
                l.classList.remove('active');
                if (parseInt(l.getAttribute('data-index')) === index) l.classList.add('active');
            });

            // Tracking
            if (storyUUID) trackView(storyUUID, index);

            // Nav Buttons
            const nav = document.createElement('div');
            nav.className = 'chapter-nav';
            nav.style.cssText = 'display:flex; justify-content:space-between; margin-top:60px; padding-top:20px; border-top:1px solid rgba(0,0,0,0.05);';

            if (index > 0) {
                const b = document.createElement('button');
                b.className = 'reader-btn';
                b.innerHTML = '<i class="fas fa-arrow-left"></i> Previous';
                b.onclick = () => renderChapter(index - 1);
                nav.appendChild(b);
            } else {
                nav.appendChild(document.createElement('div'));
            }

            if (index < chapters.length - 1) {
                const b = document.createElement('button');
                b.className = 'reader-btn';
                b.style.cssText = 'background:#d4af37; color:#fff; padding:10px 25px; border-radius:30px; font-weight:500;';
                b.innerHTML = 'Next Chapter <i class="fas fa-arrow-right"></i>';
                b.onclick = () => { renderChapter(index + 1); scrollToTop(); };
                nav.appendChild(b);
            }
            container.appendChild(nav);

            // End Story Controls
            handleFooter(index);

            scrollToTop();
            container.style.opacity = '1';
        }, 150);
    }

    function handleFooter(index) {
        const footer = document.querySelector('.reader-footer');
        if (!footer) return;
        if (index === chapters.length - 1) {
            footer.style.display = 'block';
            renderEndUI(footer);
        } else {
            footer.style.display = 'none';
        }
    }

    function renderEndUI(container) {
        let box = document.getElementById('story-end-features');
        if (box) box.remove();

        box = document.createElement('div');
        box.id = 'story-end-features';
        box.innerHTML = `
            <div style="text-align:center; padding:40px 0;">
                <h3 style="font-family:'Playfair Display'; font-size:1.8rem;">The End.</h3>
                <p style="color:#888;">Thanks for reading. We'd love your feedback!</p>
            </div>
            <div class="rating-box" style="text-align:center; margin-bottom:40px;">
                <div id="star-box" style="font-size:2.5rem; cursor:pointer;">
                    <i class="fas fa-star ch-star" data-v="1" style="color:#444;"></i>
                    <i class="fas fa-star ch-star" data-v="2" style="color:#444;"></i>
                    <i class="fas fa-star ch-star" data-v="3" style="color:#444;"></i>
                    <i class="fas fa-star ch-star" data-v="4" style="color:#444;"></i>
                    <i class="fas fa-star ch-star" data-v="5" style="color:#444;"></i>
                </div>
            </div>
            <div class="rev-box">
                <textarea id="rev-input" style="width:100%; height:100px; padding:15px; background:rgba(255,255,255,0.02); border:1px solid #444; border-radius:8px; color:inherit;" placeholder="Tell us what you thought..."></textarea>
                <button id="rev-submit" style="background:#d4af37; color:#000; border:none; padding:12px 30px; border-radius:30px; margin-top:15px; cursor:pointer; font-weight:bold;">Submit Review</button>
            </div>
            <ul id="rev-list" style="list-style:none; padding:0; margin-top:50px;"></ul>
        `;
        container.appendChild(box);

        // Star logic
        const stars = box.querySelectorAll('.ch-star');
        stars.forEach(s => {
            s.onclick = () => {
                const val = s.getAttribute('data-v');
                stars.forEach(st => st.style.color = st.getAttribute('data-v') <= val ? 'red' : '#444');
                box.setAttribute('data-rating', val);
            };
        });

        // Submit logic
        box.querySelector('#rev-submit').onclick = async () => {
            const rating = box.getAttribute('data-rating');
            const comment = document.getElementById('rev-input').value;
            if (!rating) { alert('Please select a rating'); return; }

            const token = localStorage.getItem('token');
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ targetType: 'story', targetId: storyUUID, rating, comment })
            });

            if (res.ok) {
                alert('Success!');
                loadReviews(storyUUID, box);
            }
        };

        loadReviews(storyUUID, box);
    }

    async function loadReviews(id, container) {
        try {
            const res = await fetch(`/api/reviews?targetId=${id}`);
            const data = await res.json();
            const list = container.querySelector('#rev-list');
            list.innerHTML = data.filter(r => r.status === 'approved').map(r => `
                <li style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 20px 0;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <strong style="color:#d4af37;">${r.user_name}</strong>
                        <small style="color:#666;">${new Date(r.created_at).toLocaleDateString()}</small>
                    </div>
                    <div style="color:red; margin-bottom:10px;">${'★'.repeat(r.rating)}</div>
                    <p style="opacity:0.8; font-style:italic;">"${r.comment}"</p>
                    ${r.reply ? `
                        <div style="margin-top:15px; padding:12px; border-left:2px solid #d4af37; background:rgba(212,175,55,0.05);">
                            <small style="color:#d4af37; font-weight:800;">ADMIN REPLY</small>
                            <p style="margin:5px 0 0;">${r.reply}</p>
                        </div>
                    ` : ''}
                </li>
            `).join('');
        } catch (e) { }
    }

    async function trackView(id, index) {
        try {
            await fetch(`/api/stories/${id}/chapters/${index}/view`, { method: 'POST' });
        } catch (e) { }
    }

    function scrollToTop() {
        const grid = document.querySelector('.reader-grid');
        const pos = currentChapterIndex === 0 ? 0 : grid.offsetTop - 100;
        window.scrollTo({ top: pos, behavior: 'smooth' });
    }

    // --- GLOBAL LISTENERS ---

    // Sidebar TOC click
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.toc-link');
        if (link) {
            e.preventDefault();
            const idx = parseInt(link.getAttribute('data-index'));
            renderChapter(idx);

            // Close mobile things if open
            document.querySelector('.chapter-sidebar')?.classList.remove('active');
            document.getElementById('mobile-chapter-menu')?.classList.remove('active');
            document.getElementById('sidebar-overlay')?.classList.remove('active');

            const triggerIcon = document.querySelector('#mobile-toc-trigger i');
            if (triggerIcon) triggerIcon.className = 'fas fa-list';
        }
    });

    // Mobile Toggle
    document.getElementById('mobile-toc-trigger')?.addEventListener('click', () => {
        const drawer = document.querySelector('.chapter-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        const menu = document.getElementById('mobile-chapter-menu');

        if (window.innerWidth > 900) {
            document.querySelector('.reader-grid').classList.toggle('sidebar-closed');
        } else {
            if (menu) menu.classList.toggle('active');
            else { drawer.classList.toggle('active'); overlay.classList.toggle('active'); }
        }
    });

    // Theme Toggle
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
    });

    // Floating Rating
    const fTrigger = document.getElementById('floating-rating-trigger');
    const toast = document.getElementById('rating-toast');
    if (fTrigger) {
        fTrigger.onclick = (e) => { e.stopPropagation(); fTrigger.classList.toggle('expanded'); };
        document.querySelectorAll('.anim-star').forEach(s => {
            s.onclick = async (e) => {
                e.stopPropagation();
                const v = s.getAttribute('data-v');
                const token = localStorage.getItem('token');
                const res = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ targetType: 'story', targetId: storyUUID, rating: v, comment: 'Quick star rating' })
                });
                if (res.ok) {
                    toast.classList.add('show');
                    setTimeout(() => toast.classList.remove('show'), 3000);
                    fTrigger.classList.remove('expanded');
                }
            };
        });
    }

    // Settings Toggle
    document.getElementById('settings-toggle')?.addEventListener('click', () => {
        document.getElementById('settings-menu').classList.toggle('active');
    });

    // Header hide on scroll
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
        const header = document.getElementById('reader-header');
        if (window.scrollY > lastY && window.scrollY > 100) header.classList.add('hidden');
        else header.classList.remove('hidden');
        lastY = window.scrollY;
    });

});

// Font Function (Global)
let fSize = 18;
function adjustFontSize(delta) {
    fSize += delta;
    if (fSize < 14) fSize = 14;
    if (fSize > 28) fSize = 28;
    document.getElementById('article-content').style.fontSize = fSize + 'px';
}
