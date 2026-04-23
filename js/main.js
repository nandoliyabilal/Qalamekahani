// Toast Notification System
window.showToast = function (message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

  toast.innerHTML = `
    <i class="fas ${icon}"></i>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.add('toast-fade-out');
    setTimeout(() => {
      toast.remove();
      if (container.childNodes.length === 0) {
        container.remove();
      }
    }, 500);
  }, 5000);

  // Manual remove on click
  toast.addEventListener('click', () => {
    toast.remove();
  });
};

// Override native alert to use our toast system globally
window.alert = function (message) {
  // Infer type based on message content
  const msgLower = String(message).toLowerCase();
  const type = (msgLower.includes('error') || msgLower.includes('fail')) ? 'error' : 'success';
  window.showToast(message, type);
};

// Header Scroll Effect
window.addEventListener('scroll', function () {
  const header = document.querySelector('.header');
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// Mobile Menu Toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
  });
}

// Dropdown Toggle (Mobile & Desktop Click)
const dropdowns = document.querySelectorAll('.nav-links .dropdown');
dropdowns.forEach(dropdown => {
  const link = dropdown.querySelector('a');
  if (link) {
    link.addEventListener('click', (e) => {
      // On mobile, always toggle. On desktop, toggle if needed.
      if (window.innerWidth <= 960) {
        e.preventDefault();
        dropdown.classList.toggle('active');
      } else {
        // Optional: toggle on desktop if you want exclusive click behavior
        // But since hover already works, click can just toggle the 'active' class
        e.preventDefault();
        dropdown.classList.toggle('active');
      }
    });
  }
});

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
  dropdowns.forEach(dropdown => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });
});

// Auth Check Logic
// Auth Check Logic
// Auth Check Logic
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const authLinksHelper = document.getElementById('auth-links');

  if (authLinksHelper) {
    if (token) {
      // User is logged in
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const firstLetter = userInfo.name ? userInfo.name.charAt(0).toUpperCase() : 'U';
      const notificationsOn = userInfo.notificationsOn !== false; // Default to true

      // Create LI element to replace the span/placeholder
      const li = document.createElement('li');
      li.className = 'user-avatar-container';

      // Inject Avatar and Dropdown HTML (Including Bell/Notification Toggle)
      li.innerHTML = `
          <div class="user-profile-trigger">
            <div class="user-avatar">${firstLetter}</div>
            <div id="notif-dot" style="display:none; position:absolute; top:0; right:0; width:12px; height:12px; background:#d4af37; border-radius:50%; border:2px solid #000; z-index:10;"></div>
          </div>
          <div class="avatar-dropdown">
              <a href="profile.html"><i class="fas fa-user"></i> Profile <span id="notif-count" style="display:none; background:#d4af37; color:#000; border-radius:10px; padding:2px 8px; font-size:10px; font-weight:bold; float:right; margin-top:3px;">0</span></a>
              <a href="#" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
          </div>
      `;

      // Fetch Notifications Count
      async function checkNotifications() {
        try {
          const res = await fetch('/api/notifications/unread-count', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const { count } = await res.json();
            if (count > 0) {
              document.getElementById('notif-dot').style.display = 'block';
              const countBadge = document.getElementById('notif-count');
              if (countBadge) {
                countBadge.style.display = 'inline-block';
                countBadge.textContent = count;
              }
            }
          }
        } catch (e) { }
      }
      checkNotifications();
      setInterval(checkNotifications, 60000); // Check every minute

      // Replace placeholder with proper LI
      authLinksHelper.replaceWith(li);

      // Add Click Listener to the new LI
      const dropdown = li.querySelector('.avatar-dropdown');
      const avatar = li.querySelector('.user-avatar');

      li.addEventListener('click', (e) => {
        if (avatar.contains(e.target) || e.target === li) {
          e.stopPropagation();
          dropdown.classList.toggle('active');
          li.classList.toggle('active');
        }
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!li.contains(e.target)) {
          dropdown.classList.remove('active');
        }
      });

      // Prevent dropdown content from closing the menu when clicked
      dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // Logout Listener
      const logoutBtn = li.querySelector('#logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation(); // Prevent parent click
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          window.location.href = 'index.html';
        });
      }

    } else {
      // User is not logged in - Show Login Button
      const li = document.createElement('li');
      // Style logic is now in CSS class .nav-login-btn
      li.innerHTML = `<a href="login.html" class="nav-login-btn"><i class="fas fa-sign-in-alt"></i> Login</a>`;
      authLinksHelper.replaceWith(li);
    }
  }

  // == GLOBAL PAYMENT STATUS HANDLER ==
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  if (paymentStatus === 'success') {
    window.showToast('Payment Successful! The content has been unlocked in your account.', 'success');
    // Remove param from URL without reload
    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + (window.location.search.replace(/[?&]payment=success/, '').replace(/^&/, '?'));
    window.history.replaceState({path: cleanUrl}, '', cleanUrl);
  } else if (paymentStatus === 'pending') {
    window.showToast('Payment is pending. Please complete your transaction if not already done.', 'error');
  }
});


// Audio Player Logic (Generic)
let currentAudio = null;
let currentBtn = null;

function toggleAudio(index) {
  const audio = document.getElementById(`audio-${index}`);
  const btn = document.querySelector(`.audio-card:nth-child(${index + 1}) .play-btn`);

  // Safety check if elements exist
  if (!audio || !btn) return;

  const icon = btn.querySelector('i');

  if (currentAudio && currentAudio !== audio) {
    currentAudio.pause();
    currentAudio.currentTime = 0; // Reset previous
    if (currentBtn) {
      currentBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
  }

  if (audio.paused) {
    audio.currentTime = 0; // Always start from beginning
    audio.play();
    icon.classList.remove('fa-play');
    icon.classList.add('fa-pause');
    currentAudio = audio;
    currentBtn = btn;
  } else {
    audio.pause();
    icon.classList.remove('fa-pause');
    icon.classList.add('fa-play');
    currentAudio = null;
    currentBtn = null;
  }
}

// ================= FILTERING SYSTEM =================
document.addEventListener('DOMContentLoaded', () => {

  // Generic Filter Function
  // Expects: 
  // - Buttons with class 'filter-btn' and 'data-filter' attribute
  // - Input with class 'search-input'
  // - Items container (grid) where items have 'data-category' and queryable title

  const filterBtns = document.querySelectorAll('.filter-btn');
  const searchInput = document.querySelector('.search-input');
  const items = document.querySelectorAll('.filter-item'); // generic class we will add to cards

  if (filterBtns.length > 0) {
    // Filter Click Logic
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active from all
        filterBtns.forEach(b => b.classList.remove('active'));
        // Add active to clicked
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');
        filterItems(filterValue, searchInput ? searchInput.value : '');
      });
    });

    // Search Input Logic
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const searchValue = e.target.value;
        const activeBtn = document.querySelector('.filter-btn.active');
        const filterValue = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';

        filterItems(filterValue, searchValue);
      });
    }
  }

  function filterItems(category, searchText) {
    const lowerSearch = searchText.toLowerCase();

    items.forEach(item => {
      const itemCategory = item.getAttribute('data-category');
      // We assume title is in h3 or similar, or content
      const itemText = item.innerText.toLowerCase();

      const matchesCategory = (category === 'all' || itemCategory === category);
      const matchesSearch = (itemText.includes(lowerSearch));

      if (matchesCategory && matchesSearch) {
        item.style.display = ''; // Reverts to CSS defined value (flex, grid, etc.)
        // Animation could be added here
        item.style.animation = 'fadeIn 0.5s ease';
      } else {
        item.style.display = 'none';
      }
    });
  }
});
// ================= COPY PROTECTION =================
(function () {
  // Disable Right Click
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Disable Shortcuts (Ctrl+C, Ctrl+U, F12, Ctrl+Shift+I)
  document.addEventListener('keydown', (e) => {
    if (
      (e.ctrlKey && (e.key === 'c' || e.key === 'C')) ||
      (e.ctrlKey && (e.key === 'u' || e.key === 'U')) ||
      (e.ctrlKey && (e.key === 's' || e.key === 'S')) ||
      (e.ctrlKey && (e.key === 'p' || e.key === 'P')) ||
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i'))
    ) {
      e.preventDefault();
    }
  });

  // Disable Selection via CSS injection
  const style = document.createElement('style');
  style.innerHTML = `
    body {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    input, textarea {
      -webkit-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
      user-select: text;
    }
  `;
  document.head.appendChild(style);
})();
// ================= NEWSLETTER SUBSCRIPTION =================
document.addEventListener('DOMContentLoaded', () => {
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('.newsletter-input');
      const submitBtn = newsletterForm.querySelector('.newsletter-btn');
      const email = emailInput.value;

      if (!email) return;

      // Disable UI
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

      try {
        const res = await fetch('/api/contact/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        const data = await res.json();
        if (res.ok) {
          window.showToast(data.message || 'Thank you for subscribing! We have sent a confirmation to your email.');
          newsletterForm.reset();
        } else {
          window.showToast(data.message || 'Subscription failed. This email might already be subscribed.', 'error');
        }
      } catch (err) {
        console.error('Newsletter Error:', err);
        window.showToast('An error occurred. Please check your connection.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
      }
    });
  }
});
// ================= GLOBAL LANGUAGE SELECTOR =================
(function() {
    function initLanguageSelector() {
        const savedLang = localStorage.getItem('user_lang');
        const isAlreadyShowing = document.querySelector('.lang-popup-overlay');

        if (savedLang || isAlreadyShowing) return;

        // Lock Scrolling
        document.body.classList.add('lang-locked');

        // Inject Stylesheet if not already present
        if (!document.getElementById('lang-popup-style')) {
            const link = document.createElement('link');
            link.id = 'lang-popup-style';
            link.rel = 'stylesheet';
            link.href = 'css/language-selector.css';
            document.head.appendChild(link);
        }

        // Create HTML Structure
        const overlay = document.createElement('div');
        overlay.className = 'lang-popup-overlay';
        overlay.innerHTML = `
            <div class="lang-popup-card">
                <div class="lang-popup-logo">Qalamekahani</div>
                <h2 class="lang-popup-title">Choose Your Language</h2>
                <p class="lang-popup-subtitle">Select your preferred language to continue</p>
                
                <div class="lang-options-grid">
                    <button class="lang-option-btn" data-lang="English">
                        <div class="lang-btn-text-group">
                            <div>English</div>
                            <div class="lang-btn-sub">International</div>
                        </div>
                        <i class="fas fa-globe"></i>
                    </button>
                    <button class="lang-option-btn" data-lang="Hindi">
                        <div class="lang-btn-text-group">
                            <div>हिन्दी (Hindi)</div>
                            <div class="lang-btn-sub">National Language</div>
                        </div>
                        <i class="fas fa-language"></i>
                    </button>
                    <button class="lang-option-btn" data-lang="Gujarati">
                        <div class="lang-btn-text-group">
                            <div>ગુજરાતી (Gujarati)</div>
                            <div class="lang-btn-sub">Gujarati Literature</div>
                        </div>
                        <i class="fas fa-feather-alt"></i>
                    </button>
                </div>

                <div class="lang-popup-footer">
                    &copy; 2026 Qalamekahani by Sabirkhan Pathan
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Animate In
        setTimeout(() => overlay.classList.add('active'), 100);

        // Click Handlers
        const btns = overlay.querySelectorAll('.lang-option-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.getAttribute('data-lang');
                localStorage.setItem('user_lang', lang);
                overlay.classList.remove('active');
                document.body.classList.remove('lang-locked');
                
                // Show Success Toast
                window.showToast(`Language set to ${lang}`, 'success');

                // Remove from DOM after transition
                setTimeout(() => {
                    overlay.remove();
                    // Force reload or event to update content
                    window.location.reload();
                }, 500);
            });
        });
    }

    // Language Sync for existing pages (stories.html, audio.html, etc.)
    function syncPageLanguage() {
        const savedLang = localStorage.getItem('user_lang');
        if (!savedLang) return;

        // 1. Sync on-page filters
        const langOptions = document.querySelectorAll('[data-lang]');
        if (langOptions.length > 0) {
            langOptions.forEach(opt => {
                const optLang = (opt.getAttribute('data-lang') || '').toLowerCase();
                
                // Rule: English = "all" (See everything)
                // Rule: Hindi/Gujarati = strict filter
                if (savedLang === 'English') {
                    if (optLang === 'all' && !opt.classList.contains('active')) opt.click();
                } else {
                    if (optLang === savedLang.toLowerCase()) {
                        if (!opt.classList.contains('active')) opt.click();
                    }
                }
            });
        }

        // 2. Global UI Translation
        translateUI(savedLang);
    }

    const translations = {
        Hindi: {
            "Home": "होम",
            "Stories": "कहानियां",
            "Reading Stories": "कहानियां पढ़ें",
            "Images & Wallpapers": "इमेज और वॉलपेपर",
            "Audio Stories": "ऑडियो कहानियां",
            "Books": "किताबें",
            "Blog": "ब्लॉग",
            "About": "बारे में",
            "Contact": "संपर्क",
            "Login": "लॉगिन",
            "Logout": "लॉगआउट",
            "Profile": "प्रोफ़ाइल",
            "Latest Stories": "नवीनतम कहानियां",
            "Stories That Touch The Soul": "आत्मा को छू लेने वाली कहानियां",
            "Welcome to My World of Words": "शब्दों की मेरी दुनिया में आपका स्वागत है",
            "Read Stories": "कहानियां पढ़ें",
            "Listen Audio": "ऑडियो सुनें",
            "Buy Books": "किताबें खरीदें",
            "View All Stories": "सभी कहानियां देखें",
            "Stay Updated": "अपडेट रहें",
            "Weaving stories that touch your soul": "आत्मा को छू लेने वाली कहानियों की बुनाई",
            "Quick Links": "त्वरित लिंक",
            "Choose Your Language": "अपनी भाषा चुनें",
            "Your Email": "आपका ईमेल"
        },
        Gujarati: {
            "Home": "હોમ",
            "Stories": "વાર્તાઓ",
            "Reading Stories": "વાર્તાઓ વાંચો",
            "Images & Wallpapers": "ઈમેજ અને વોલપેપર",
            "Audio Stories": "ઓડિયો વાર્તાઓ",
            "Books": "પુસ્તકો",
            "Blog": "બ્લોગ",
            "About": "વિશે",
            "Contact": "સંપર્ક",
            "Login": "લોગિન",
            "Logout": "લોગઆઉટ",
            "Profile": "પ્રોફાઇલ",
            "Latest Stories": "નવીનતમ વાર્તાઓ",
            "Stories That Touch The Soul": "આત્માને સ્પર્શી જાય તેવી વાર્તાઓ",
            "Welcome to My World of Words": "શબ્દોની મારી દુનિયામાં આપનું સ્વાગત છે",
            "Read Stories": "વાર્તાઓ વાંચો",
            "Listen Audio": "ઓડિયો સાંભળો",
            "Buy Books": "પુસ્તકો ખરીદો",
            "View All Stories": "બધી વાર્તાઓ જુઓ",
            "Stay Updated": "અપડેટ રહો",
            "Weaving stories that touch your soul": "આત્માને સ્પર્શી જાય તેવી વાર્તાઓનું સર્જન",
            "Quick Links": "ઝડપી લિંક્સ",
            "Choose Your Language": "તમારી ભાષા પસંદ કરો",
            "Your Email": "તમારું ઈમેલ"
        }
    };

    function translateUI(lang) {
        if (!lang || lang === 'English') return;
        const dict = translations[lang];
        if (!dict) return;

        // Use requestIdleCallback to avoid blocking the main thread
        const runTranslation = () => {
            // Translate links and common labels - Be more specific with selectors to save time
            const elements = document.querySelectorAll('.nav-links a, .hero-title, .hero-subtitle, .section-title, .section-subtitle, .ls-title, .ls-subtitle, .btn, .footer-brand, .footer-tagline, .footer-heading, .footer-links a, .view-all-btn');
            
            elements.forEach(el => {
                const text = el.textContent.trim();
                if (dict[text]) {
                    const originalHTML = el.innerHTML;
                    const iconMatch = originalHTML.match(/<i.*<\/i>/); 
                    if (iconMatch) {
                        el.innerHTML = `${dict[text]} ${iconMatch[0]}`;
                    } else {
                        el.textContent = dict[text];
                    }
                }
            });

            // Specific placeholder translations
            const inputs = document.querySelectorAll('input[placeholder]');
            inputs.forEach(input => {
                const p = input.getAttribute('placeholder');
                if (dict[p]) input.setAttribute('placeholder', dict[p]);
            });
        };

        if (window.requestIdleCallback) {
            window.requestIdleCallback(runTranslation);
        } else {
            setTimeout(runTranslation, 100);
        }
    }

    // Call on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initLanguageSelector();
            setTimeout(syncPageLanguage, 500); 
        });
    } else {
        initLanguageSelector();
        setTimeout(syncPageLanguage, 500);
    }
})();

// ================= PROFESSIONAL SHARING SYSTEM =================
// Supports sharing actual image files + professional text template
window.shareContent = async function({ title, description, url, imageUrl, type = 'story' }) {
    const typeEmojis = { story: '📖', audio: '🎧', book: '📚', blog: '📰' };
    const emoji = typeEmojis[type] || '✨';
    
    // 1. Standardize message content (fixed character length for consistency)
    const cleanDescription = (description || '').replace(/<[^>]*>?/gm, '').trim();
    const shortDescription = cleanDescription.substring(0, 100).padEnd(103, '.'); 
    
    // Structure: Welcome -> Emoji + Title -> Consistent Synopsis -> Brand -> Link -> Footer
    const professionalText = `🌟 *Welcome to Qalamekahani!* 🌟\n\n${emoji} *${title}*\n\n"${shortDescription}"\n\n✨ Immerse yourself in the soul-touching world of stories, audio & literature by *Sabirkhan Pathan*. ✨\n\n🔗 *Full ${type === 'audio' ? 'Audio' : type.charAt(0).toUpperCase() + type.slice(1)} Link:* ${url}\n\n🚀 *Qalamekahani - Weaving stories that touch your soul.*`;

    const shareData = {
        title: title,
        text: professionalText
    };

    try {
        // 2. Try to share as a FILE (for platform file preview)
        if (navigator.canShare && imageUrl) {
            try {
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const file = new File([blob], `kalamekahani-${type}.jpg`, { type: 'image/jpeg' });
                
                if (navigator.canShare({ files: [file] })) {
                    // With a file, we put EVERYTHING in the text to ensure recipient sees it
                    shareData.files = [file];
                }
            } catch (fileErr) {
                console.warn("[Share] File processing failed.", fileErr);
            }
        }

        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            // 3. Desktop/Fallback (Clipboard)
            await navigator.clipboard.writeText(professionalText);
            window.showToast('Details copied to clipboard! You can now share it.');
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('[Share] Error:', err);
            navigator.clipboard.writeText(url);
            window.showToast('Link copied to clipboard!');
        }
    }
};
