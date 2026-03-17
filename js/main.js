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
