// reader.js - Logic for Immersive Reading Mode

// Override native alert to use our toast system globally
window.showToast = function (message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        // basic css for toast if main css is missing
        const css = document.createElement('style');
        css.innerHTML = `.toast-container{position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px}.toast{background:#333;color:#fff;padding:12px 24px;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);font-family:sans-serif;opacity:1;transition:all .3s ease}.toast.error{background:#ef4444}.toast.success{background:#10b981}`;
        document.head.appendChild(css);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-message">${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

window.alert = function (message) {
    const msgLower = String(message).toLowerCase();
    const type = (msgLower.includes('error') || msgLower.includes('fail')) ? 'error' : 'success';
    window.showToast(message, type);
};

document.addEventListener('DOMContentLoaded', () => {

    // 1. Get Story ID/Slug from URL
    const params = new URLSearchParams(window.location.search);
    const storyUrlParam = params.get('id');

    // State
    let chapters = [];
    let currentChapterIndex = 0;
    let storyUUID = null; // Store real UUID after fetch
    let isSubmittingReview = false;

    if (!storyUrlParam) {
        document.body.innerHTML = '<div style="text-align:center; padding:50px;"><h1>No Story Selected</h1><a href="stories.html">Go Back</a></div>';
        return;
    }

    // 2. Fetch Story Content
    fetch(`/api/stories/${storyUrlParam}?increment=false`)
        .then(res => {
            if (!res.ok) throw new Error(res.status === 404 ? 'Story not found in database. Please check the URL or try searching again.' : 'Server error while loading story.');
            return res.json();
        })
        .then(data => {
            if (!data || !data.id) throw new Error('Invalid story data received.');

            storyUUID = data.id;
            window.currentStoryId = data.id;

            // Updated Meta
            document.title = `${data.title} | Read Qalamekahani`;
            document.getElementById('header-story-title').textContent = data.title;
            document.getElementById('hero-title').textContent = data.title;
            document.getElementById('hero-category').textContent = data.category || 'Story';
            document.getElementById('hero-author').textContent = data.author || 'Sabirkhan Pathan';
            document.getElementById('hero-date').textContent = new Date(data.created_at || Date.now()).toLocaleDateString();

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

            // Handle start chapter from URL
            const startCh = params.get('ch');
            const startIndex = (startCh !== null && !isNaN(startCh)) ? parseInt(startCh) : 0;
            
            // Initial Load
            renderChapter(startIndex);
        })
        .catch(err => {
            console.error(err);
            document.body.innerHTML = `
                <div style="text-align:center; padding:80px 20px; color:#fff; background:#000; min-height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                    <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:#ff3333; margin-bottom:20px;"></i>
                    <h1 style="font-family:'Playfair Display'; margin-bottom:10px;">Error Loading Story</h1>
                    <p style="color:#888; max-width:400px; margin-bottom:30px; font-size:1.1rem;">${err.message}</p>
                    <a href="stories.html" style="background:#d4af37; color:#000; padding:12px 30px; border-radius:30px; text-decoration:none; font-weight:bold; transition:all 0.3s;">Back to Stories</a>
                </div>`;
        });

    // --- PARSING LOGIC ---
    function parseChapters(html) {
        if (!html) return;
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        const decoded = txt.value;
        const parser = new DOMParser();
        const doc = parser.parseFromString(decoded, 'text/html');
        const headings = Array.from(doc.querySelectorAll('h2'));

        if (headings.length === 0) {
            chapters.push({ title: "Full Story", nodes: Array.from(doc.body.childNodes) });
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

    // --- RENDER CHAPTER ---
    function renderChapter(index) {
        if (index < 0 || index >= chapters.length) return;
        currentChapterIndex = index;

        const container = document.getElementById('article-content');
        container.style.opacity = '0';

        setTimeout(() => {
            container.innerHTML = '';
            const ch = chapters[index];
            ch.nodes.forEach(n => container.appendChild(n.cloneNode(true)));

            const paras = container.querySelectorAll('p');
            paras.forEach((p, i) => {
                p.style.animation = `fadeInUp 0.8s forwards ${i * 0.05}s`;
                p.style.opacity = '0';
            });

            document.querySelectorAll('.toc-link').forEach(l => {
                l.classList.remove('active');
                if (parseInt(l.getAttribute('data-index')) === index) l.classList.add('active');
            });

            if (storyUUID) trackView(storyUUID, index);

            // Nav Buttons
            const nav = document.createElement('div');
            nav.className = 'chapter-nav-wrapper';

            if (index > 0) {
                const b = document.createElement('button');
                b.className = 'entik-nav-btn prev-btn';
                b.innerHTML = '<i class="fas fa-arrow-left"></i> Previous';
                b.onclick = (e) => { 
                    e.preventDefault();
                    e.stopPropagation();
                    renderChapter(index - 1); 
                };
                nav.appendChild(b);
            } else {
                nav.appendChild(document.createElement('div'));
            }

            if (index < chapters.length - 1) {
                const b = document.createElement('button');
                b.className = 'entik-nav-btn next-btn';
                b.innerHTML = 'Next Chapter <i class="fas fa-arrow-right"></i>';
                b.onclick = (e) => { 
                    e.preventDefault();
                    e.stopPropagation();
                    renderChapter(index + 1); 
                };
                nav.appendChild(b);
            }
            container.appendChild(nav);

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
                <h3 style="font-family:'Playfair Display'; font-size:2.5rem; margin-bottom:10px; color:#d4af37;">The End.</h3>
                <p style="color:#888; font-size:1.1rem;">We hope you enjoyed "${document.getElementById('hero-title').textContent}".</p>
            </div>
            <div class="rating-box" style="text-align:center; margin-bottom:40px;">
                <p style="margin-bottom:15px; text-transform:uppercase; letter-spacing:2px; font-size:0.8rem; color:#666;">Rate this story</p>
                <div id="star-box" style="font-size:3.5rem; cursor:pointer; display:flex; justify-content:center; gap:10px;">
                    <i class="fas fa-star ch-star" data-v="1" style="color:#222; transition:all 0.3s;"></i>
                    <i class="fas fa-star ch-star" data-v="2" style="color:#222; transition:all 0.3s;"></i>
                    <i class="fas fa-star ch-star" data-v="3" style="color:#222; transition:all 0.3s;"></i>
                    <i class="fas fa-star ch-star" data-v="4" style="color:#222; transition:all 0.3s;"></i>
                    <i class="fas fa-star ch-star" data-v="5" style="color:#222; transition:all 0.3s;"></i>
                </div>
            </div>
            <div class="rev-box" style="max-width:600px; margin:0 auto;">
                <textarea id="rev-input" style="width:100%; height:120px; padding:20px; background:transparent; border:1px solid #ccc; border-radius:15px; color:var(--text-ink, #000); font-family:inherit; outline:none; transition:border 0.3s;" placeholder="Write your thoughts here..."></textarea>
                <button id="rev-submit" style="background:#d4af37; color:#000; border:none; padding:15px 40px; border-radius:30px; margin-top:20px; cursor:pointer; font-weight:900; font-size:1.1rem; transition:all 0.3s; width:100%; text-transform:uppercase; letter-spacing:1px; box-shadow:0 8px 25px rgba(212,175,55,0.2);">Post My Review</button>
            </div>
            <div id="rev-status" style="text-align:center; margin-top:15px; font-size:0.9rem;"></div>
            <ul id="rev-list" style="list-style:none; padding:0; margin-top:60px;"></ul>
        `;
        container.appendChild(box);

        const stars = box.querySelectorAll('.ch-star');
        stars.forEach(s => {
            s.onclick = () => {
                const val = s.getAttribute('data-v');
                stars.forEach(st => st.style.color = st.getAttribute('data-v') <= val ? '#ff3333' : '#222');
                box.setAttribute('data-rating', val);
            };
        });

        box.querySelector('#rev-submit').onclick = async () => {
            if (isSubmittingReview) return;
            const rating = box.getAttribute('data-rating');
            const comment = document.getElementById('rev-input').value.trim();
            if (!rating) { alert('Please select a star rating first.'); return; }
            if (!comment) { alert('Please write a short review before posting.'); return; }

            isSubmittingReview = true;
            const btn = document.getElementById('rev-submit');
            btn.textContent = 'Submitting...';
            btn.style.opacity = '0.5';

            const token = localStorage.getItem('token');
            try {
                const res = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ targetType: 'story', targetId: storyUUID, rating, comment })
                });

                if (res.ok) {
                    alert('Rating & Review submitted successfully!');
                    document.getElementById('rev-input').value = '';
                    loadReviews(storyUUID, box);
                } else {
                    const error = await res.json();
                    alert('Submission failed: ' + (error.message || 'Something went wrong.'));
                }
            } catch (e) {
                alert('Connection error. Please check your internet and try again.');
            } finally {
                isSubmittingReview = false;
                btn.textContent = 'Post My Review';
                btn.style.opacity = '1';
            }
        };

        loadReviews(storyUUID, box);
    }

    async function loadReviews(id, container) {
        try {
            const res = await fetch(`/api/reviews?targetId=${id}`);
            const data = await res.json();
            const list = container.querySelector('#rev-list');
            const approved = data.filter(r => r.status === 'approved');
            if (approved.length === 0) {
                list.innerHTML = '<p style="text-align:center; color:#555;">No reviews yet. Be the first to write one!</p>';
                return;
            }
            list.innerHTML = approved.map(r => `
                <li style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 30px 0;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <strong style="color:#d4af37; font-size:1.2rem;">${r.user_name}</strong>
                        <small style="color:#555;">${new Date(r.created_at).toLocaleDateString()}</small>
                    </div>
                    <div style="color:#ff3333; margin-bottom:15px; font-size:1.3rem;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
                    <p style="opacity:0.85; font-style:italic; line-height:1.7; font-size:1.1rem; color:#ccc;">"${r.comment}"</p>
                    ${r.reply ? `
                        <div style="margin-top:25px; padding:20px; border-left:4px solid #d4af37; background:rgba(212,175,55,0.04); border-radius:0 12px 12px 0; border:1px solid rgba(212,175,55,0.1); border-left:4px solid #d4af37;">
                            <small style="color:#d4af37; font-weight:900; letter-spacing:2px; text-transform:uppercase; font-size:0.7rem; display:block; margin-bottom:8px;">Author Reponse</small>
                            <p style="margin:0; color:#eee; line-height:1.6; font-size:1rem;">${r.reply}</p>
                        </div>
                    ` : ''}
                </li>
            `).join('');
        } catch (e) { }
    }

    async function trackView(id, index) {
        try { fetch(`/api/stories/${id}/chapters/${index}/view`, { method: 'POST' }); } catch (e) { }
    }

    function scrollToTop() {
        const grid = document.querySelector('.reader-grid');
        const pos = currentChapterIndex === 0 ? 0 : grid.offsetTop - 80;
        window.scrollTo({ top: pos, behavior: 'instant' });
    }

    // --- INTERACTIVE LISTENERS ---

    // Swipe Gestures
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const threshold = 70; // Minimum distance for a swipe
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;

        // Only trigger if horizontal swipe is significantly stronger than vertical movement 
        // (Ensures normal up/down scrolling doesn't accidental turn the page)
        if (Math.abs(diffX) > Math.abs(diffY) + 30) {
            
            // Left Swipe -> Next
            if (diffX < -threshold) {
                if (currentChapterIndex < chapters.length - 1) {
                    renderChapter(currentChapterIndex + 1);
                }
            }
            // Right Swipe -> Previous
            else if (diffX > threshold) {
                if (currentChapterIndex > 0) {
                    renderChapter(currentChapterIndex - 1);
                }
            }
        }
    }

    // Toggle Chapter Menu
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.toc-link');
        if (link) {
            e.preventDefault();
            renderChapter(parseInt(link.getAttribute('data-index')));
            document.querySelector('.chapter-sidebar')?.classList.remove('active');
            document.getElementById('sidebar-overlay')?.classList.remove('active');
        }
    });

    // Theme Toggle
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const icon = document.querySelector('#theme-toggle i');
        if (icon) {
            if (document.body.classList.contains('dark-theme')) icon.className = 'fas fa-sun';
            else icon.className = 'fas fa-moon';
        }
    });

    // Floating Rating Logic
    const fTrigger = document.getElementById('floating-rating-trigger');
    const toast = document.getElementById('rating-toast');
    if (fTrigger) {
        fTrigger.onclick = (e) => { e.stopPropagation(); fTrigger.classList.toggle('expanded'); };
        document.querySelectorAll('.anim-star').forEach(s => {
            s.onclick = async (e) => {
                e.stopPropagation();
                if (isSubmittingReview) return;
                const v = s.getAttribute('data-v');

                // Visual Immediate Feedback (Force RED)
                const sNodes = document.querySelectorAll('.anim-star');
                sNodes.forEach(st => {
                    if (st.getAttribute('data-v') <= v) {
                        st.style.color = '#ff3333';
                        st.classList.add('active');
                    } else {
                        st.style.color = 'rgba(255,255,255,0.4)';
                        st.classList.remove('active');
                    }
                });

                isSubmittingReview = true;
                const token = localStorage.getItem('token');
                try {
                    // NEW: Submit to Chapter-Specific Endpoint
                    const res = await fetch(`/api/stories/${storyUUID}/chapters/${currentChapterIndex}/rating`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ rating: v })
                    });

                    if (res.ok) {
                        toast.classList.add('show');
                        setTimeout(() => {
                            toast.classList.remove('show');
                            fTrigger.classList.remove('expanded');
                            sNodes.forEach(st => {
                                st.classList.remove('active');
                                st.style.color = ''; // Reset to auto
                            });
                        }, 2500);
                    } else {
                        const err = await res.json();
                        alert('Chapter Rating failed: ' + (err.message || 'Error'));
                    }
                } catch (e) {
                    alert('Network error while rating chapter.');
                } finally {
                    isSubmittingReview = false;
                }
            };
        });
    }

    // Settings Menu
    document.getElementById('settings-toggle')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('settings-menu').classList.toggle('active');
    });

    document.addEventListener('click', () => {
        document.getElementById('settings-menu')?.classList.remove('active');
    });

    // Header hide/show on scroll
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
        const header = document.getElementById('reader-header');
        if (window.scrollY > lastY && window.scrollY > 120) header.classList.add('hidden');
        else header.classList.remove('hidden');
        lastY = window.scrollY;
    });

});

// Font Adjustment (Global)
let fSize = 18;
function adjustFontSize(delta) {
    fSize += delta;
    if (fSize < 14) fSize = 14;
    if (fSize > 32) fSize = 32;
    const content = document.getElementById('article-content');
    if (content) content.style.fontSize = fSize + 'px';
}
