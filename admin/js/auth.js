const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('button');
        const originalBtnText = submitBtn.innerHTML;

        // Loading State
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loader border-white/20 border-t-white w-5 h-5"></span>';
        errorMessage.classList.add('hidden');

        try {
            const response = await fetch(`${API_URL}/auth/admin-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Success
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify({
                    name: data.name,
                    email: data.email,
                    role: data.role
                }));

                // Redirect
                window.location.href = 'dashboard.html';
            } else {
                // Error
                throw new Error(data.message || 'Login failed');
            }

        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}
