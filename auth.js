// auth.js - VERSION 2, WITH CLOSE BUTTON AND DROPDOWN FIXES

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const API_URL = 'https://runup-api.veronica-vero2vv.workers.dev';

    // --- DOM ELEMENTS ---
    const guestView = document.getElementById('guest-view');
    const userView = document.getElementById('user-view');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const userMenuBtn = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const authModal = document.getElementById('auth-modal');
    
    // --- INITIALIZATION ---
    checkLoginState();
    setupEventListeners();

    // --- EVENT LISTENERS SETUP ---
    function setupEventListeners() {
        if (loginBtn) loginBtn.addEventListener('click', () => openModal('login'));
        if (registerBtn) registerBtn.addEventListener('click', () => openModal('register'));
        if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (userDropdown) userDropdown.classList.toggle('hidden');
            });
        }

        // Close dropdown when clicking anywhere else
        window.addEventListener('click', () => {
            if (userDropdown && !userDropdown.classList.contains('hidden')) {
                userDropdown.classList.add('hidden');
            }
        });

        // Modal specific listeners
        if (authModal) {
            const modalCloseBtn = authModal.querySelector('.modal-close-btn');
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            const showRegisterLink = document.getElementById('show-register');
            const showLoginLink = document.getElementById('show-login');

            if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
            if (loginForm) loginForm.addEventListener('submit', handleLogin);
            if (registerForm) registerForm.addEventListener('submit', handleRegister);
            
            if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                switchForm('register');
            });
            if (showLoginLink) showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                switchForm('login');
            });

            // Close modal if clicking overlay
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) closeModal();
            });
        }
    }

    // --- LOGIC FUNCTIONS ---
    function checkLoginState() {
        const token = localStorage.getItem('jwt');
        const username = localStorage.getItem('username');

        if (token && username) {
            if (guestView) guestView.classList.add('hidden');
            if (userView) userView.classList.remove('hidden');
            if (userMenuBtn) userMenuBtn.textContent = username;
        } else {
            if (guestView) guestView.classList.remove('hidden');
            if (userView) userView.classList.add('hidden');
        }
    }

    function openModal(mode) {
        if (!authModal) return;
        const authError = document.getElementById('auth-error');
        authModal.classList.remove('hidden');
        switchForm(mode);
        if(authError) authError.textContent = '';
    }

    function closeModal() {
        if (!authModal) return;
        authModal.classList.add('hidden');
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
    }

    function switchForm(mode) {
        if (!authModal) return;
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const authError = document.getElementById('auth-error');
        if(authError) authError.textContent = '';

        if (mode === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        const authError = document.getElementById('auth-error');
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        authError.textContent = 'Logging in...';

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Login failed');

            localStorage.setItem('jwt', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('userId', data.userId);
            
            closeModal();
            checkLoginState();

        } catch (error) {
            authError.textContent = error.message;
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        const authError = document.getElementById('auth-error');
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        authError.textContent = 'Creating account...';

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email }) 
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Registration failed');

            switchForm('login');
            authError.style.color = '#21d07a';
            authError.textContent = 'Account created! Please log in.';
            document.getElementById('register-form').reset();
            
            setTimeout(() => { 
                authError.style.color = ''; 
                if (authError.textContent === 'Account created! Please log in.') {
                    authError.textContent = '';
                }
            }, 3000);

        } catch (error) {
            authError.textContent = error.message;
        }
    }

    function handleLogout(e) {
        e.preventDefault();
        localStorage.removeItem('jwt');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        checkLoginState();
        if (window.location.pathname.includes('account.html') || window.location.pathname.includes('watchlist.html')) {
            window.location.href = 'index.html';
        }
    }
});```

### **Your Action Plan**

1.  **Backend:** Add the `JWT_SECRET` to your worker using the `wrangler secret put` command.
2.  **Frontend:** Replace your `auth.js` with the updated version above.
3.  **Deploy:** Commit and push the new `auth.js` to GitHub to deploy the frontend change.

After these two fixes, both login and the "X" button should work perfectly.