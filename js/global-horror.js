// Global Horror Theme Script - "Pure Black" Edition
// Enforces a minimal Dark/Black theme on all pages

(function () {
    // Prevent double injection
    if (window.horrorGlobalLoaded) return;
    window.horrorGlobalLoaded = true;

    // 1. Inject CSS Link if not present
    if (!document.querySelector('link[href*="horror-theme.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/horror-theme.css';
        document.head.appendChild(link);
    }

    // 2. Force Enable Mode (No Toggle)
    document.body.classList.add('horror-mode');

    // 3. Ensure it stays enabled
    localStorage.setItem('horrorMode', 'enabled');

    // 4. Remove any existing floating elements if they exist
    const floats = document.querySelectorAll('#global-horror-toggle, .cart-float-icon');
    floats.forEach(el => el.style.display = 'none');

    // No animations, no loops, just static black style.

})();
