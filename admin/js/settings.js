document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadSettings();
    loadAdminProfile();

    // Event Listeners
    document.getElementById('heroSettingsForm').addEventListener('submit', handleHeroSettings);
    document.getElementById('contentSettingsForm').addEventListener('submit', handleContentSettings);
    document.getElementById('contactSettingsForm').addEventListener('submit', handleContactSettings);
    document.getElementById('aboutSettingsForm').addEventListener('submit', handleAboutSettings);
    document.getElementById('adminProfileForm').addEventListener('submit', handleAdminProfile);
});

let currentSettings = {};

// Load Site Settings (Hero, Contact, Content)
async function loadSettings() {
    try {
        const response = await fetchWithAuth('/settings');
        if (response.ok) {
            currentSettings = await response.json();
            populateSettings(currentSettings);
        } else {
            console.error('Failed to fetch settings');
        }
    } catch (error) {
        console.error('Error fetching settings:', error);
    }
}

// Populate Fields
function populateSettings(settings) {
    if (!settings) return;

    // Helper to safe set value
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };

    setVal('heroTitle', settings.heroTitle);
    setVal('heroSubtitle', settings.heroSubtitle);
    setVal('heroImage', settings.heroImage);

    setVal('storyCategories', Array.isArray(settings.storyCategories) ? settings.storyCategories.join(', ') : settings.storyCategories);
    setVal('audioCategories', Array.isArray(settings.audioCategories) ? settings.audioCategories.join(', ') : settings.audioCategories);
    setVal('bookCategories', Array.isArray(settings.bookCategories) ? settings.bookCategories.join(', ') : settings.bookCategories);
    setVal('blogCategories', Array.isArray(settings.blogCategories) ? settings.blogCategories.join(', ') : settings.blogCategories);

    setVal('contactEmail', settings.contactEmail);
    setVal('contactPhone', settings.contactPhone);
    setVal('contactPhone', settings.contactPhone);
    setVal('contactAddress', settings.contactAddress);

    setVal('aboutHeading', settings.aboutHeading);
    setVal('aboutShort', settings.aboutShort || settings.aboutText); // Fallback
    setVal('aboutLong', settings.aboutLong);
    setVal('aboutImage', settings.aboutImage);
}

// Load Admin Profile (Name, Email)
async function loadAdminProfile() {
    try {
        // We can get this from /auth/me or localStorage. Let's use /auth/me for freshness.
        const response = await fetchWithAuth('/auth/me');
        if (response.ok) {
            const user = await response.json();
            document.getElementById('adminNameInput').value = user.name || '';
            document.getElementById('adminEmailInput').value = user.email || '';

            // Also update sidebar name
            document.getElementById('adminName').textContent = user.name || 'Admin';
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
    }
}

// --- Handlers ---
window.previewHeroImage = function (input) {
    const previewDiv = document.getElementById('heroImagePreview');
    const fileDisplay = document.getElementById('fileNameDisplay');
    const img = previewDiv.querySelector('img');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            img.src = e.target.result;
            previewDiv.classList.remove('hidden');
            fileDisplay.textContent = input.files[0].name;
        }
        reader.readAsDataURL(input.files[0]);
    } else {
        fileDisplay.textContent = 'No file chosen';
        previewDiv.classList.add('hidden');
    }
}

async function handleHeroSettings(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const OriginalText = btn.textContent;
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
        let imageUrl = document.getElementById('heroImage').value;
        const fileInput = document.getElementById('heroImageFile');

        // Check if file is selected
        if (fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            // Upload File
            const uploadRes = await fetchWithAuth('/upload', {
                method: 'POST',
                body: formData
                // fetchWithAuth handles content-type for FormData
            });

            if (!uploadRes.ok) {
                const err = await uploadRes.json();
                throw new Error(err.message || 'Image upload failed');
            }

            const uploadData = await uploadRes.json();
            // Assuming upload returns { url: 'uploads/filename.jpg' }
            // We need to make sure the URL is accessible from frontend.
            // Usually it's relative path like 'uploads/file.jpg'.
            // If frontend is separate, might need full URL, but here backend serves static.
            imageUrl = uploadData.url.startsWith('/') ? uploadData.url : '/' + uploadData.url;

            // Update the hidden/visual input
            document.getElementById('heroImage').value = imageUrl;
        }

        const data = {
            heroTitle: document.getElementById('heroTitle').value,
            heroSubtitle: document.getElementById('heroSubtitle').value,
            heroImage: imageUrl
        };

        await saveSettings(data, 'Homepage settings saved successfully!');

    } catch (error) {
        console.error(error);
        alert(error.message || 'Error saving settings');
    } finally {
        btn.textContent = OriginalText;
        btn.disabled = false;
    }
}

async function handleContentSettings(e) {
    e.preventDefault();
    const data = {
        storyCategories: document.getElementById('storyCategories').value,
        audioCategories: document.getElementById('audioCategories').value,
        bookCategories: document.getElementById('bookCategories').value,
        blogCategories: document.getElementById('blogCategories').value
    };
    await saveSettings(data, 'Content settings saved successfully!');
}

async function handleContactSettings(e) {
    e.preventDefault();
    const data = {
        contactEmail: document.getElementById('contactEmail').value,
        contactPhone: document.getElementById('contactPhone').value,
        contactAddress: document.getElementById('contactAddress').value
    };
    await saveSettings(data, 'Contact information saved successfully!');
}

window.previewAboutImage = function (input) {
    const previewDiv = document.getElementById('aboutImagePreview');
    const fileDisplay = document.getElementById('aboutFileNameDisplay');
    const img = previewDiv.querySelector('img');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            img.src = e.target.result;
            previewDiv.classList.remove('hidden');
            fileDisplay.textContent = input.files[0].name;
        }
        reader.readAsDataURL(input.files[0]);
    } else {
        fileDisplay.textContent = 'No file chosen';
        previewDiv.classList.add('hidden');
    }
}

async function handleAboutSettings(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const OriginalText = btn.textContent;
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
        let imageUrl = document.getElementById('aboutImage').value;
        const fileInput = document.getElementById('aboutImageFile');

        if (fileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            const uploadRes = await fetchWithAuth('/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) {
                const err = await uploadRes.json();
                throw new Error(err.message || 'Image upload failed');
            }

            const uploadData = await uploadRes.json();
            imageUrl = uploadData.url.startsWith('/') ? uploadData.url : '/' + uploadData.url;
            document.getElementById('aboutImage').value = imageUrl;
        }

        const data = {
            aboutHeading: document.getElementById('aboutHeading').value,
            aboutShort: document.getElementById('aboutShort').value,
            aboutLong: document.getElementById('aboutLong').value,
            aboutImage: imageUrl
        };

        await saveSettings(data, 'About settings saved successfully!');

    } catch (error) {
        console.error(error);
        alert(error.message || 'Error saving settings');
    } finally {
        btn.textContent = OriginalText;
        btn.disabled = false;
    }
}

// Generic Save Function
async function saveSettings(data, successMsg) {
    try {
        const response = await fetchWithAuth('/settings', {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert(successMsg);
            loadSettings(); // Refresh
        } else {
            alert('Failed to save settings');
        }
    } catch (error) {
        console.error(error);
        alert('Error saving settings');
    }
}

// Handle Admin Profile Update
async function handleAdminProfile(e) {
    e.preventDefault();

    const name = document.getElementById('adminNameInput').value;
    const email = document.getElementById('adminEmailInput').value;
    const password = document.getElementById('adminPasswordInput').value;
    const confirmPassword = document.getElementById('adminConfirmPasswordInput').value;

    const data = { name, email };

    if (password) {
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        data.password = password;
    }

    try {
        const response = await fetchWithAuth('/auth/update-profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Profile updated successfully!');
            const updatedUser = await response.json();
            // Update localStorage if needed
            const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
            user.name = updatedUser.name;
            user.email = updatedUser.email;
            localStorage.setItem('adminUser', JSON.stringify(user));

            loadAdminProfile();
            document.getElementById('adminPasswordInput').value = '';
            document.getElementById('adminConfirmPasswordInput').value = '';
        } else {
            const err = await response.json();
            alert(err.message || 'Failed to update profile');
        }
    } catch (error) {
        console.error(error);
        alert('Error updating profile');
    }
}
