// reader.js - Logic for Immersive Reading Mode

document.addEventListener('DOMContentLoaded', () => {

    // 1. Get Story ID and Load Content
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

    // Fetch from API
    fetch(`/api/stories/${storyId}`)
        .then(res => {
            if (!res.ok) throw new Error('Story not found');
            return res.json();
        })
        .then(story => {
            // Populate Hero Meta
            document.title = `${story.title} | Read QalamVerse`;
            document.getElementById('header-story-title').textContent = story.title;
            document.getElementById('hero-title').textContent = story.title;
            document.getElementById('hero-category').textContent = story.category || 'Story';
            document.getElementById('hero-author').textContent = story.author || 'Unknown';
            document.getElementById('hero-date').textContent = new Date(story.created_at || story.date).toLocaleDateString();

            // Calculate Read Time
            const wordCount = (story.content || '').split(/\s+/).length;
            const readTime = Math.ceil(wordCount / 200) + ' min read';
            document.getElementById('hero-time').textContent = readTime;

            // Store real ID for reviews
            window.currentStoryId = story.id;

            // AUTO-ENABLE HORROR MODE
            const catLower = (story.category || '').toLowerCase();
            if (catLower.includes('horror') || catLower.includes('ghost') || catLower.includes('thriller') || catLower.includes('mystery')) {
                // We need to call the toggle function defined below. 
                // Since it's inside the same scope (event listener), we can access it if we hoist or move definition.
                // Or we just manually set the class here.
                document.body.classList.add('horror-mode');

                // Also update the toggle button state if it exists
                const hToggle = document.getElementById('horror-toggle');
                if (hToggle) hToggle.style.color = '#ff3333';
            }


            // --- NEW: CONTENT PARSING LOGIC ---
            // Parse the HTML strong content into chapters
            const parser = new DOMParser();

            let contentHTML = story.content || '<p>No content available.</p>';

            // DECODE HTML ENTITIES (Re-applied: This IS required to show formatting instead of code)
            const txt = document.createElement('textarea');
            txt.innerHTML = contentHTML;
            contentHTML = txt.value;

            // Auto-format: If still no HTML tags detected, convert newlines to paragraphs
            if (!contentHTML.trim().startsWith('<')) {
                contentHTML = contentHTML
                    .split(/\n\s*\n/) // Split by double newlines for paragraphs
                    .map(para => `<p>${para.trim()}</p>`)
                    .join('');
            }

            const doc = parser.parseFromString(contentHTML, 'text/html');

            // We assume chapters start with <h2 class="chapter-title">

            // We assume chapters start with <h2 class="chapter-title">
            const nodes = Array.from(doc.body.children);
            let currentChapter = [];
            let chapterTitle = "Start";
            let chapterId = "start";

            nodes.forEach((node) => {
                if (node.tagName === 'H2') {
                    // If we have accumulated content for a previous chapter, push it
                    if (currentChapter.length > 0) {
                        chapters.push({
                            title: chapterTitle,
                            id: chapterId,
                            content: currentChapter
                        });
                    }
                    // Start new chapter
                    currentChapter = [];
                    currentChapter.push(node);
                    chapterTitle = node.textContent;
                    chapterId = node.id || `chapter-${chapters.length + 1}`;
                } else {
                    currentChapter.push(node);
                }
            });

            // Push the last chapter
            if (currentChapter.length > 0) {
                chapters.push({
                    title: chapterTitle,
                    id: chapterId,
                    content: currentChapter
                });
            }

            // Fallback if no H2s found (just one big chapter)
            if (chapters.length === 0 && currentChapter.length === 0 && nodes.length > 0) {
                chapters.push({
                    title: "Full Story",
                    id: "full",
                    content: nodes
                });
            }


            // GENERATE TOC (Desktop)
            const tocList = document.getElementById('toc-list');
            if (tocList) {
                tocList.innerHTML = '';
                if (chapters.length > 1) {
                    chapters.forEach((chapter, index) => {
                        const li = document.createElement('li');
                        li.className = 'toc-item';
                        let displayTitle = chapter.title.replace(/^Chapter\s+\d+[:\s]*/i, '');
                        if (!displayTitle.trim()) displayTitle = chapter.title;

                        li.innerHTML = `<a href="#" class="toc-link" data-index="${index}">${displayTitle}</a>`;
                        tocList.appendChild(li);
                    });
                }
            }

            // GENERATE MOBILE DROPDOWN (New)
            const mobileMenu = document.getElementById('mobile-chapter-menu');
            if (mobileMenu) {
                mobileMenu.innerHTML = ''; // Clear existing
                if (chapters.length > 0) {
                    chapters.forEach((chapter, index) => {
                        const link = document.createElement('a');
                        link.className = 'toc-link';
                        link.setAttribute('data-index', index);
                        link.textContent = chapter.title.replace(/^Chapter\s+\d+[:\s]*/i, '') || chapter.title;
                        link.href = "#";
                        mobileMenu.appendChild(link);
                    });

                    // Add click listener (if not already added, but cloning/replacing avoids dupes)
                    // Better to use onclick directly for simplicity or ensure single listener
                    mobileMenu.onclick = (e) => {
                        const link = e.target.closest('.toc-link');
                        if (link) {
                            e.preventDefault();
                            const index = parseInt(link.getAttribute('data-index'));
                            renderChapter(index);
                            mobileMenu.classList.remove('active');

                            // Reset Icon
                            const btnIcon = document.querySelector('#mobile-toc-trigger i');
                            if (btnIcon) btnIcon.className = 'fas fa-list';

                            scrollToTop();
                        }
                    };
                }
            }

            // Logic for when only 1 chapter
            if (chapters.length <= 1) {
                const sb = document.querySelector('.chapter-sidebar');
                if (sb) sb.style.display = 'none';

                const grid = document.querySelector('.reader-grid');
                if (grid) grid.style.gridTemplateColumns = '1fr';
            }

            // Initial Render
            renderChapter(0);
        })
        .catch(err => {
            console.error(err);
            document.body.innerHTML = `<div style="text-align:center; padding:50px; color:red;">
                <h1>Error Loading Story</h1>
                <p>Could not fetch the story content.</p>
                <a href="stories.html" style="color:#d4af37">Back to Stories</a>
             </div>`;
        });


    // --- RENDER CHAPTER FUNCTION ---
    function renderChapter(index) {
        if (index < 0 || index >= chapters.length) return;

        currentChapterIndex = index;
        const contentContainer = document.getElementById('article-content');

        // Fade out slightly before changing (optional, but nice)
        contentContainer.style.opacity = '0';

        setTimeout(() => {
            contentContainer.innerHTML = ''; // Clear previous

            const chapter = chapters[index];

            // Append Nodes
            chapter.content.forEach(node => {
                // We need to clone the node because it's from the parsed doc
                const clone = node.cloneNode(true);
                contentContainer.appendChild(clone);
            });

            // Apply delay animation
            const paragraphs = contentContainer.querySelectorAll('p');
            paragraphs.forEach((p, i) => {
                p.style.animation = 'none'; // Reset
                p.offsetHeight; // Trigger reflow
                p.style.animation = `fadeInUp 0.8s forwards ${i * 0.1}s`;
                p.style.opacity = '0'; // Ensure hidden start
            });

            // Update TOC Active State
            document.querySelectorAll('.toc-link').forEach(link => link.classList.remove('active'));
            const activeLink = document.querySelector(`.toc-link[data-index="${index}"]`);
            if (activeLink) activeLink.classList.add('active');

            // Inject Navigation Buttons (Next/Prev)
            const navContainer = document.createElement('div');
            navContainer.className = 'chapter-nav';
            navContainer.style.marginTop = '60px';
            navContainer.style.display = 'flex';
            navContainer.style.justifyContent = 'space-between';
            navContainer.style.gap = '20px';

            if (index > 0) {
                const prevBtn = document.createElement('button');
                prevBtn.className = 'reader-btn';
                prevBtn.style.border = '1px solid var(--text-ink)';
                prevBtn.style.borderRadius = '30px';
                prevBtn.style.padding = '10px 20px';
                prevBtn.style.fontSize = '0.9rem';
                prevBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Previous Chapter';
                prevBtn.onclick = () => { renderChapter(index - 1); scrollToTop(); };
                navContainer.appendChild(prevBtn);
            } else {
                navContainer.appendChild(document.createElement('div')); // Spacer
            }

            if (index < chapters.length - 1) {
                const nextBtn = document.createElement('button');
                nextBtn.className = 'reader-btn';
                nextBtn.style.background = '#d4af37';
                nextBtn.style.color = '#fff';
                nextBtn.style.borderRadius = '30px';
                nextBtn.style.padding = '10px 20px';
                nextBtn.style.fontSize = '0.9rem';
                nextBtn.innerHTML = 'Next Chapter <i class="fas fa-arrow-right"></i>';
                nextBtn.onclick = () => { renderChapter(index + 1); scrollToTop(); };
                navContainer.appendChild(nextBtn);
            }

            contentContainer.appendChild(navContainer);

            // Re-apply font size
            if (typeof adjustFontSize === 'function') adjustFontSize(0);

            // Scroll to Top of Content
            scrollToTop();

            // Fade In
            contentContainer.style.opacity = '1';

            // Special: If it's the last chapter, show the Footer (End Mark etc)
            // In the original HTML, footer is outside article-content.
            // We can toggle its visibility OR better yet, inject our new footer features here.
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

    // --- END OF STORY FEATURES ---
    function renderEndOfStoryFeatures(footerContainer) {
        // Clear previous injections to avoid duplicates
        const existingEndFeat = document.getElementById('end-story-features');
        if (existingEndFeat) existingEndFeat.remove();

        const container = document.createElement('div');
        container.id = 'end-story-features';
        container.style.marginTop = '40px';
        container.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h3 style="font-family: 'Playfair Display', serif; font-size: 1.8rem;">Thanks for reading this story!</h3>
            </div>
            
            <!-- Rating Section -->
            <div class="rating-container">
                <p style="margin-bottom: 10px; font-family: 'Poppins';">Rate this story:</p>
                <div id="star-rating-box">
                    <i class="fas fa-star star-rating" data-value="1"></i>
                    <i class="fas fa-star star-rating" data-value="2"></i>
                    <i class="fas fa-star star-rating" data-value="3"></i>
                    <i class="fas fa-star star-rating" data-value="4"></i>
                    <i class="fas fa-star star-rating" data-value="5"></i>
                </div>
            </div>

            <!-- Review Section -->
            <div class="review-section">
                <h4 style="font-family: 'Poppins'; margin-bottom: 20px;">Reviews</h4>
                <div class="review-form">
                    <textarea id="review-text" rows="3" placeholder="Write a review..."></textarea>
                    <button id="submit-review" class="reader-btn" style="background: #222; color: #fff; padding: 8px 20px; border-radius: 4px; font-size: 0.9rem;">Post Review</button>
                </div>
                <ul id="review-list" class="review-list"></ul>
            </div>

            <!-- Back to Stories Button -->
            <div style="text-align: center; margin-top: 50px; margin-bottom: 50px;">
                <button onclick="window.location.href='stories.html'" class="reader-btn" style="background: transparent; border: 2px solid #d4af37; color: var(--text-ink); padding: 12px 30px; border-radius: 30px; font-weight: 600;">
                    <i class="fas fa-arrow-left"></i> Back to Stories
                </button>
            </div>
        `;

        // Insert before the footer's existing content or replace? 
        // User wants "Thanks for reading" etc. Let's prepend to footer or append.
        // Let's append to footer, but clear footer's old static content if needed?
        // The static content had "The End" and a heart. We can keep "The End".
        // Let's just append.
        footerContainer.appendChild(container);

        // Initialize Rating to 0
        const stars = container.querySelectorAll('.star-rating');
        const storageKeyRating = `rating_${storyId}`;
        const savedRating = 0; // Force 0 default as requested

        updateStars(savedRating);

        stars.forEach(star => {
            star.addEventListener('click', () => {
                const val = star.getAttribute('data-value');
                // localStorage.setItem(storageKeyRating, val); // Optional: remember user choice? User asked for default 0 on load.
                updateStars(val);
                container.setAttribute('data-rating', val); // Store on container for submit
            });
        });

        function updateStars(count) {
            stars.forEach(s => {
                if (parseInt(s.getAttribute('data-value')) <= parseInt(count)) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        }

        // --- SUBMIT REVIEW ---
        const reviewInput = container.querySelector('#review-text');
        const submitBtn = container.querySelector('#submit-review');

        submitBtn.addEventListener('click', async () => {
            const text = reviewInput.value.trim();
            const currentRating = parseInt(container.getAttribute('data-rating') || '0');

            if (!text && currentRating === 0) {
                alert('Please provide a rating and a review.');
                return;
            }
            if (currentRating === 0) {
                alert('Please select a star rating.');
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Posting...';

                const token = localStorage.getItem('token');
                if (!token) {
                    alert('You must be logged in to submit a review.');
                    window.location.href = 'login.html';
                    return;
                }

                const res = await fetch('/api/reviews', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        targetType: 'story',
                        targetId: window.currentStoryId, // Use the real UUID
                        rating: currentRating,
                        comment: text
                        // Name is handled by backend from token
                    })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(`${res.status}: ${errData.message || 'Unknown Error'}`);
                }

                // SUCCESS: Replace Form & Stars with Message
                // We target the parent containers of Stars and Form
                const ratingBox = container.querySelector('.rating-container');
                const reviewBox = container.querySelector('.review-section');

                // Simplified Success UI
                if (ratingBox) ratingBox.style.display = 'none';
                if (reviewBox) {
                    reviewBox.innerHTML = `
                        <div style="text-align:center; padding: 40px; background: rgba(212, 175, 55, 0.1); border-radius: 8px; border: 1px solid #d4af37;">
                            <h3 style="font-family: 'Playfair Display'; color: #d4af37; margin-bottom: 10px;">Thanks for your Review!</h3>
                            <p>It has been submitted for approval.</p>
                        </div>
                    `;
                }

            } catch (err) {
                console.error(err);
                alert(`Error submitting review: ${err.message}`);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Post Review';
            }
        });

        // --- FETCH & SHOW APPROVED REVIEWS ---
        fetchApprovedReviews(storyId, container);
    }

    async function fetchApprovedReviews(storyId, container) {
        try {
            // We need a public endpoint for APPROVED reviews. 
            // Current /api/reviews is admin only for listing ALL.
            // We should use /api/reviews?targetId=... but filter by approved in backend?
            // Or just fetch all and filter client side? (Not secure but works for now if RLS allows reading all)
            // RLS "Enable read access for all reviews" is TRUE. So we can read all.

            const res = await fetch(`/api/reviews?targetId=${storyId}`);
            if (!res.ok) return;
            const allReviews = await res.json();

            // Filter client side for "approved" status
            const approvedReviews = allReviews.filter(r => r.status === 'approved' || r.isApproved === true);

            const list = container.querySelector('#review-list');
            if (list && approvedReviews.length > 0) {
                list.innerHTML = approvedReviews.map(r => `
                    <li style="border-bottom: 1px solid rgba(255,255,255,0.1); padding: 15px 0;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <strong style="color: #d4af37;">${r.user_name || 'Reader'}</strong>
                            <span style="color: #666; font-size:0.8rem;">${new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <div style="color: #ffc107; font-size: 0.8rem; margin-bottom: 8px;">
                            ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
                        </div>
                        <p style="color: #ccc; font-size: 0.95rem;">${r.comment}</p>
                    </li>
                `).join('');
            }
        } catch (e) { console.error('Error fetching reviews', e); }
    }

    function scrollToTop() {
        // Scroll to the top of the main column or hero
        const hero = document.getElementById('hero-section');
        // If we are deep down, scroll to hero.
        // Actually, for chapter 2+, we might want to hide the big hero title?
        // User didn't specify, but typical pagination keeps the focus on content.
        // Let's just scroll to the top of the article container.
        const mainCol = document.querySelector('.reader-main-col'); // or .reader-hero

        // Better UX: Scroll to where the content starts
        if (currentChapterIndex === 0) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // For subsequent chapters, align top of content
            const headerOffset = 100;
            const elementPosition = document.querySelector('.reader-grid').getBoundingClientRect().top + window.scrollY;
            window.scrollTo({
                top: elementPosition - headerOffset,
                behavior: 'smooth'
            });
        }
    }


    // 2. Event Listeners for TOC
    // 2. Event Listeners for TOC (Delegation)
    const tocList = document.getElementById('toc-list');
    if (tocList) {
        tocList.addEventListener('click', (e) => {
            // Handle clicks on the link or its children
            const link = e.target.closest('.toc-link');
            if (link) {
                e.preventDefault();
                const index = parseInt(link.getAttribute('data-index'));

                // 1. Render Chapter
                renderChapter(index);

                // 2. Close Sidebar (Important: Mobile usability)
                const drawer = document.querySelector('.chapter-sidebar');
                const overlay = document.getElementById('sidebar-overlay');
                if (drawer) drawer.classList.remove('active');
                if (overlay) overlay.classList.remove('active');

                // 3. Scroll to Top
                scrollToTop();
            }
        });
    }


    // 3. Scroll Progress & Header Logic (Simplified for Pagination)
    // We still want the header to hide/show, but progress bar is less relevant per chapter?
    // Or progress bar shows progress within the CHAPTER.
    const progressBar = document.getElementById('progress-bar');
    const header = document.getElementById('reader-header');
    const titleSm = document.getElementById('header-story-title');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        // Progress Bar (Per Chapter)
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + "%";

        // Header Hide/Show
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
        }

        // Show Title in Header after hero
        if (currentScrollY > 300) {
            titleSm.classList.add('visible');
        } else {
            titleSm.classList.remove('visible');
        }

        lastScrollY = currentScrollY;
    });

    // 4. Mobile TOC & Navigation Logic
    // REVISED: Move Toggle to "Start Reading" Area for Mobile
    const drawer = document.querySelector('.chapter-sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    // Inject Close Button into Drawer
    if (drawer && !drawer.querySelector('.sidebar-close-btn')) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'sidebar-close-btn';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.addEventListener('click', toggleDrawer);
        drawer.prepend(closeBtn); // Add to top
    }

    function toggleDrawer() {
        drawer.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    if (overlay) overlay.addEventListener('click', toggleDrawer);

    // Remove old header toggle listener if exists/hide it
    const oldToggle = document.getElementById('toc-toggle');
    if (oldToggle) oldToggle.style.display = 'none'; // Hide valid header toggle if we move it

    // 5. Start Reading Button 
    const hero = document.getElementById('hero-section');
    if (hero) {
        // Clean up previous
        const existingContainer = document.querySelector('.start-btn-container');
        if (existingContainer) existingContainer.remove();

        const startBtnContainer = document.createElement('div');
        startBtnContainer.className = 'start-btn-container';
        startBtnContainer.style.textAlign = 'center';
        startBtnContainer.style.margin = '40px 0';
        startBtnContainer.style.display = 'flex';
        startBtnContainer.style.justifyContent = 'center';
        startBtnContainer.style.alignItems = 'center';
        startBtnContainer.style.gap = '15px'; // Gap between start btn and hamburger

        // Just the Start Reading Button AND Hamburger
        // We will make the container relative so the dropdown can position against it
        startBtnContainer.style.position = 'relative';

        const hamburgerHTML = `
            <button class="mobile-toc-toggle" id="mobile-toc-trigger" style="background: transparent; border: 1px solid #d4af37; color: #d4af37; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 1.2rem; margin-right: 15px;">
                <i class="fas fa-list"></i>
            </button>
        `;

        const startBtnHTML = `
            <button id="start-reading-btn" 
                style="background: transparent; border: 1px solid #d4af37; padding: 10px 25px; border-radius: 30px; font-family: 'Poppins'; cursor: pointer; color: var(--text-ink); transition: all 0.3s;">
                Start Reading <i class="fas fa-arrow-down" style="margin-left:8px;"></i>
            </button>
        `;

        // Add Dropdown Container HTML
        const dropdownHTML = `
            <div id="mobile-chapter-menu" class="mobile-chapter-dropdown">
                <!-- Links injected here -->
            </div>
        `;

        startBtnContainer.innerHTML = hamburgerHTML + startBtnHTML + dropdownHTML;
        hero.after(startBtnContainer);

        // Attach Listeners
        const sBtn = document.getElementById('start-reading-btn');
        if (sBtn) {
            sBtn.addEventListener('click', () => {
                const elementPosition = document.getElementById('article-content').getBoundingClientRect().top + window.scrollY;
                window.scrollTo({
                    top: elementPosition - 100,
                    behavior: 'smooth'
                });
            });
        }

        // Attach Mobile Toggle Listener -> Toggles Dropdown (Mobile) OR Sidebar (Desktop)
        const mBtn = document.getElementById('mobile-toc-trigger');
        if (mBtn) {
            const icon = mBtn.querySelector('i');

            mBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent immediate body click close

                // CHECK SCREEN WIDTH
                if (window.innerWidth > 900) {
                    // DESKTOP: Toggle Sidebar & Grid
                    const grid = document.querySelector('.reader-grid');
                    if (grid) {
                        grid.classList.toggle('sidebar-closed');

                        // Toggle Icon (List <-> Times)
                        if (!grid.classList.contains('sidebar-closed')) {
                            // Sidebar OPEN -> show LIST (or maybe Times if it means "Close Me"?)
                            // User said "close kare" -> click to Close. So default icon is List or Times?
                            // Let's adhere to: Open = Times (Close action), Closed = List (Open action).
                            // Default is OPEN. So default icon should be TIME (if we follow strict logic) OR just List acts as toggle.
                            // Let's just swap icons to indicate state change.
                            // Default state is OPEN -> Icon is LIST.
                            // Click -> Closed -> Icon should stay LIST? Or maybe Times? 
                            // Actually, standard pattern: 'x' to close. 
                            // Let's assume user sees LIST, clicks it, sidebar closes. 
                            // Then sees LIST again to open? Or something else? 
                            // Let's use: Active (Open) = List (default), Click to Close.
                            // Closed = List with Slash? Or just List.
                            // Let's keep it simple: Swap to 'fa-times' when it's closed? No that's weird.
                            // Let's swap to 'fa-times' when sidebar is VISIBLE so user knows clicking it will close it?
                            // But default is visible.

                            // Let's try:
                            // Sidebar Visible (Default) -> Icon: List (or maybe 'Chevron Left'?)
                            // 2. Click -> Sidebar Hides -> Icon: List.
                            // Let's make it toggle the 'active' class on button for visual feedback, but maybe not icon change if confusing.
                            // OR:
                            // Sidebar Visible -> Icon: Times (Close).
                            // Sidebar Hidden -> Icon: List (Open).
                            icon.className = 'fas fa-times'; // It is OPEN, so clicking will CLOSE.
                        } else {
                            // Sidebar HIDDEN -> Click to Open
                            icon.className = 'fas fa-list';
                        }
                    }
                } else {
                    // MOBILE: Dropdown Logic
                    const mobileMenu = document.getElementById('mobile-chapter-menu');
                    if (mobileMenu) {
                        mobileMenu.classList.toggle('active');

                        // Toggle Icon
                        if (mobileMenu.classList.contains('active')) {
                            icon.className = 'fas fa-times';
                        } else {
                            icon.className = 'fas fa-list';
                        }
                    }
                }
            });

            // Close when clicking outside (Mobile Only?)
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 900) {
                    const mobileMenu = document.getElementById('mobile-chapter-menu');
                    if (mobileMenu && !startBtnContainer.contains(e.target)) {
                        mobileMenu.classList.remove('active');
                        if (icon) icon.className = 'fas fa-list'; // Reset icon
                    }
                }
            });

            // Handle Window Resize to reset state if needed?
            // Optional but good practice.
        }
    }


    // 6. Settings Logic (Theme / Font) - SAME AS BEFORE
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const icon = themeToggle.querySelector('i');
        if (document.body.classList.contains('dark-theme')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });

    const settingsToggle = document.getElementById('settings-toggle');
    const settingsMenu = document.getElementById('settings-menu');

    settingsToggle.addEventListener('click', () => {
        settingsMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (settingsToggle && !settingsToggle.contains(e.target) && !settingsMenu.contains(e.target)) {
            settingsMenu.classList.remove('active');
        }
    });

    // 7. HORROR MODE LOGIC
    const horrorToggle = document.getElementById('horror-toggle');
    const horrorElements = document.querySelector('.horror-elements');

    if (horrorToggle) {
        horrorToggle.addEventListener('click', () => {
            toggleHorrorMode();
        });
    }

    function toggleHorrorMode(forceState = null) {
        const body = document.body;
        const isActive = body.classList.contains('horror-mode');
        const newState = forceState !== null ? forceState : !isActive;

        if (newState) {
            body.classList.add('horror-mode');
            if (horrorToggle) horrorToggle.style.color = '#ff3333';
            // Start particle generation if needed (optional optimization: only when active)
        } else {
            body.classList.remove('horror-mode');
            if (horrorToggle) horrorToggle.style.color = '';
        }
    }

    // Check for "Horror" category to auto-enable
    // This needs to be inside the fetch process or accessed after fetch. 
    // We'll move the auto-check inside the fetch .then() block, but we need the function exposed or duplicated.
    // Ideally, we move this logic up or call it from the fetch block.

}); // End of DOMContentLoaded

// Font Function Helper
let currentFontSize = 18;
function adjustFontSize(change) {
    currentFontSize += change;
    if (currentFontSize < 14) currentFontSize = 14;
    if (currentFontSize > 26) currentFontSize = 26;

    const content = document.getElementById('article-content');
    if (content) content.style.fontSize = `${currentFontSize}px`;
}
