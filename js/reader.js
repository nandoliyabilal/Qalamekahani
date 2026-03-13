// reader.js - Logic for Immersive Reading Mode

document.addEventListener('DOMContentLoaded', () => {

    // 1. Get Story ID and Load Content
    const params = new URLSearchParams(window.location.search);
    const storyId = params.get('id');

    // Global State for Reading
    let chapters = [];
    let currentChapterIndex = 0;

    if (!storyId) {
        document.body.innerHTML = '<div style="text-align:center; padding:50px;"><h1>No Story Selected</h1><a href="stories.html">Go Back</a></div>';
        return;
    }

    // CHAPTER VIEW TRACKING
    async function trackChapterView(sid, index) {
        try {
            await fetch(`/api/stories/${sid}/chapters/${index}/view`, { method: 'POST' });
        } catch (e) { console.warn('View tracking failed', e); }
    }

    // Fetch from API
    fetch(`/api/stories/${storyId}?increment=false`)
        .then(res => {
            if (!res.ok) throw new Error('Story not found');
            return res.json();
        })
        .then(story => {
            // Populate Hero Meta
            document.title = `${story.title} | Read Qalamekahani`;
            document.getElementById('header-story-title').textContent = story.title;
            document.getElementById('hero-title').textContent = story.title;
            document.getElementById('hero-category').textContent = story.category || 'Story';
            document.getElementById('hero-author').textContent = story.author || 'Unknown';
            document.getElementById('hero-date').textContent = new Date(story.created_at || story.date).toLocaleDateString();

            // Calculate Read Time
            const wordCount = (story.content || '').split(/\s+/).length;
            const readTime = Math.ceil(wordCount / 200) + ' min read';
            document.getElementById('hero-time').textContent = readTime;

            window.currentStoryId = story.id;

            // AUTO-ENABLE HORROR MODE
            const catLower = (story.category || '').toLowerCase();
            if (catLower.includes('horror') || catLower.includes('ghost') || catLower.includes('thriller') || catLower.includes('mystery')) {
                document.body.classList.add('horror-mode');
                const hToggle = document.getElementById('horror-toggle');
                if (hToggle) hToggle.style.color = '#ff3333';
            }

            // --- CONTENT PARSING LOGIC ---
            const parser = new DOMParser();
            let contentHTML = story.content || '<p>No content available.</p>';

            const txt = document.createElement('textarea');
            txt.innerHTML = contentHTML;
            contentHTML = txt.value;

            if (!contentHTML.trim().startsWith('<')) {
                contentHTML = contentHTML.split(/\n\s*\n/).map(para => `<p>${para.trim()}</p>`).join('');
            }

            const doc = parser.parseFromString(contentHTML, 'text/html');
            const nodes = Array.from(doc.body.children);
            let currentChapter = [];
            let chapterTitle = "Start";

            nodes.forEach((node) => {
                if (node.tagName === 'H2') {
                    if (currentChapter.length > 0) {
                        chapters.push({ title: chapterTitle, content: currentChapter });
                    }
                    currentChapter = [node];
                    chapterTitle = node.textContent;
                } else {
                    currentChapter.push(node);
                }
            });

            if (currentChapter.length > 0) {
                chapters.push({ title: chapterTitle, content: currentChapter });
            }

            if (chapters.length === 0 && nodes.length > 0) {
                chapters.push({ title: "Full Story", content: nodes });
            }

            // GENERATE TOC
            const tocList = document.getElementById('toc-list');
            if (tocList) {
                tocList.innerHTML = '';
                chapters.forEach((chapter, index) => {
                    const li = document.createElement('li');
                    li.className = 'toc-item';
                    let displayTitle = chapter.title.replace(/^Chapter\s+\d+[:\s]*/i, '') || chapter.title;
                    li.innerHTML = `<a href="#" class="toc-link" data-index="${index}">${displayTitle}</a>`;
                    tocList.appendChild(li);
                });
            }

            if (chapters.length <= 1) {
                const sb = document.querySelector('.chapter-sidebar');
                if (sb) sb.style.display = 'none';
                const grid = document.querySelector('.reader-grid');
                if (grid) grid.style.gridTemplateColumns = '1fr';
            }

            renderChapter(0);
        })
        .catch(err => {
            console.error(err);
            document.body.innerHTML = `<div style="text-align:center; padding:50px; color:red;"><h1>Error</h1><a href="stories.html">Back</a></div>`;
        });


    function renderChapter(index) {
        if (index < 0 || index >= chapters.length) return;
        currentChapterIndex = index;
        const contentContainer = document.getElementById('article-content');
        contentContainer.style.opacity = '0';

        setTimeout(() => {
            contentContainer.innerHTML = '';
            const chapter = chapters[index];
            chapter.content.forEach(node => {
                contentContainer.appendChild(node.cloneNode(true));
            });

            const paragraphs = contentContainer.querySelectorAll('p');
            paragraphs.forEach((p, i) => {
                p.style.animation = `fadeInUp 0.8s forwards ${i * 0.1}s`;
                p.style.opacity = '0';
            });

            document.querySelectorAll('.toc-link').forEach(link => link.classList.remove('active'));
            const activeLink = document.querySelector(`.toc-link[data-index="${index}"]`);
            if (activeLink) activeLink.classList.add('active');

            // Nav Buttons
            const navContainer = document.createElement('div');
            navContainer.className = 'chapter-nav';
            navContainer.style.marginTop = '60px';
            navContainer.style.display = 'flex';
            navContainer.style.justifyContent = 'space-between';

            if (index > 0) {
                const b = document.createElement('button');
                b.className = 'reader-btn';
                b.innerHTML = '<i class="fas fa-arrow-left"></i> Previous';
                b.onclick = () => renderChapter(index - 1);
                navContainer.appendChild(b);
            } else {
                navContainer.appendChild(document.createElement('div'));
            }

            if (index < chapters.length - 1) {
                const b = document.createElement('button');
                b.className = 'reader-btn';
                b.style.background = '#d4af37';
                b.style.color = '#fff';
                b.style.padding = '10px 20px';
                b.style.borderRadius = '30px';
                b.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
                b.onclick = () => renderChapter(index + 1);
                navContainer.appendChild(b);
            }
            contentContainer.appendChild(navContainer);

            // Track View
            trackChapterView(storyId, index);

            scrollToTop();
            contentContainer.style.opacity = '1';

            const footer = document.querySelector('.reader-footer');
            if (footer) {
                if (index === chapters.length - 1) {
                    footer.style.display = 'block';
                    renderEndOfStoryFeatures(footer);
                } else {
                    footer.style.display = 'none';
                }
            }
        }, 200);
    }

    function renderEndOfStoryFeatures(footerContainer) {
        let feat = document.getElementById('end-story-features');
        if (feat) feat.remove();

        feat = document.createElement('div');
        feat.id = 'end-story-features';
        feat.style.marginTop = '40px';
        feat.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h3 style="font-family: 'Playfair Display', serif; font-size: 1.8rem;">Thanks for reading!</h3>
            </div>
            <div class="rating-container">
                <p>Rate this story:</p>
                <div id="star-rating-box" style="font-size: 2rem; cursor: pointer;">
                    <i class="fas fa-star star-rating" data-value="1"></i>
                    <i class="fas fa-star star-rating" data-value="2"></i>
                    <i class="fas fa-star star-rating" data-value="3"></i>
                    <i class="fas fa-star star-rating" data-value="4"></i>
                    <i class="fas fa-star star-rating" data-value="5"></i>
                </div>
            </div>
            <div class="review-section">
                <h4 style="margin-bottom: 20px;">Reviews</h4>
                <div class="review-form">
                    <textarea id="review-text" rows="3" placeholder="Write a review..." style="width:100%; padding:15px; border-radius:8px; background:transparent; border:1px solid #444; color:inherit;"></textarea>
                    <button id="submit-review" class="reader-btn" style="background:#d4af37; color:#000; padding:10px 25px; border-radius:30px; margin-top:10px; font-weight:bold;">Post Review</button>
                </div>
                <ul id="review-list" style="list-style:none; padding:0; margin-top:30px;"></ul>
            </div>
        `;
        footerContainer.appendChild(feat);

        const stars = feat.querySelectorAll('.star-rating');
        stars.forEach(s => {
            s.onclick = () => {
                const v = s.getAttribute('data-value');
                stars.forEach(st => st.style.color = st.getAttribute('data-value') <= v ? '#d4af37' : '#444');
                feat.setAttribute('data-rating', v);
            };
        });

        const subBtn = feat.querySelector('#submit-review');
        subBtn.onclick = async () => {
            const val = feat.getAttribute('data-rating') || 0;
            const comment = feat.querySelector('#review-text').value;
            if (!val) { alert('Please select stars'); return; }

            const token = localStorage.getItem('token');
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ targetType: 'story', targetId: window.currentStoryId, rating: val, comment })
            });

            if (res.ok) {
                alert('Success!');
                fetchApprovedReviews(storyId, feat);
            }
        };

        fetchApprovedReviews(storyId, feat);
    }

    async function fetchApprovedReviews(sid, container) {
        try {
            const res = await fetch(`/api/reviews?targetId=${sid}`);
            const data = await res.json();
            const list = container.querySelector('#review-list');
            list.innerHTML = data.filter(r => r.status === 'approved').map(r => `
                <li style="border-bottom: 1px solid #333; padding: 15px 0;">
                    <div style="display:flex; justify-content:space-between; color:#d4af37;">
                        <strong>${r.user_name}</strong>
                        <small>${new Date(r.created_at).toLocaleDateString()}</small>
                    </div>
                    <div style="color:#ffc107; margin-bottom:5px;">${'★'.repeat(r.rating)}</div>
                    <p style="font-style:italic;">"${r.comment}"</p>
                    ${r.reply ? `<div style="margin-top:10px; border-left:2px solid #d4af37; padding-left:10px;"><small style="color:#d4af37; font-weight:bold;">ADMIN:</small> <p style="margin:0; font-size:0.9rem;">${r.reply}</p></div>` : ''}
                </li>
            `).join('');
        } catch (e) { }
    }

    // FLOATING RATING LOGIC
    const rTrigger = document.getElementById('floating-rating-trigger');
    const aStars = document.querySelectorAll('.anim-star');
    const toast = document.getElementById('rating-toast');

    if (rTrigger) {
        rTrigger.onmouseenter = () => rTrigger.classList.add('expanded');
        document.addEventListener('click', (e) => {
            if (!rTrigger.contains(e.target)) rTrigger.classList.remove('expanded');
        });

        aStars.forEach(s => {
            s.onclick = async (e) => {
                e.stopPropagation();
                const v = s.getAttribute('data-v');
                const token = localStorage.getItem('token');
                const res = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ targetType: 'story', targetId: window.currentStoryId, rating: v, comment: 'Rated via quick-star' })
                });
                if (res.ok) {
                    toast.classList.add('show');
                    setTimeout(() => toast.classList.remove('show'), 3000);
                    rTrigger.classList.remove('expanded');
                }
            };
        });
    }

    function scrollToTop() {
        const grid = document.querySelector('.reader-grid');
        const offset = currentChapterIndex === 0 ? 0 : grid.offsetTop - 100;
        window.scrollTo({ top: offset, behavior: 'smooth' });
    }

    // Header logic
    const header = document.getElementById('reader-header');
    let lastY = window.scrollY;
    window.onscroll = () => {
        if (window.scrollY > lastY) header.classList.add('hidden');
        else header.classList.remove('hidden');
        lastY = window.scrollY;
    };

    // Toc Toggle
    const drawer = document.querySelector('.chapter-sidebar');
    document.getElementById('mobile-toc-trigger')?.addEventListener('click', () => {
        drawer.classList.toggle('active');
    });

});

let currentFontSize = 18;
function adjustFontSize(change) {
    currentFontSize += change;
    document.getElementById('article-content').style.fontSize = `${currentFontSize}px`;
}
