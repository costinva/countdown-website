// auth.js - Handles all frontend authentication logic

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const API_URL = 'https://runup-api.veronica-vero2vv.workers.dev';

    // --- DOM ELEMENTS ---
    // Header elements
    const guestView = document.getElementById('guest-view');
    const userView = document.getElementById('user-view');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const userMenuBtn = document.getElementById('user-menu-button');
    const userDropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');

    // Modal elements
    const authModal = document.getElementById('auth-modal');
    if (!authModal) return; // Exit if modal doesn't exist on this page (e.g. admin page)
    
    const modalCloseBtn = authModal.querySelector('.modal-close-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const authError = document.getElementById('auth-error');

    // --- INITIALIZATION ---
    checkLoginState();

    // --- EVENT LISTENERS ---

    // 1. UI Interaction (Opening/Closing Modals & Menus)
    if (loginBtn) loginBtn.addEventListener('click', () => openModal('login'));
    if (registerBtn) registerBtn.addEventListener('click', () => openModal('register'));
    
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    
    // Close modal if clicking outside content
    window.addEventListener('click', (e) => {
        if (e.target === authModal) closeModal();
    });

    // Switch between Login and Register forms within modal
    if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm('register');
    });
    if (showLoginLink) showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm('login');
    });

    // User Dropdown Menu toggle
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent window click from closing immediately
            userDropdown.classList.toggle('hidden');
        });
    }
    // Close dropdown when clicking anywhere else
    window.addEventListener('click', () => {
        if (userDropdown && !userDropdown.classList.contains('hidden')) {
            userDropdown.classList.add('hidden');
        }
    });

    // 2. Form Submissions via API
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);


    // --- LOGIC FUNCTIONS ---

    function checkLoginState() {
        const token = localStorage.getItem('jwt');
        const username = localStorage.getItem('username');

        if (token && username) {
            // User is logged in
            if (guestView) guestView.classList.add('hidden');
            if (userView) userView.classList.remove('hidden');
            if (userMenuBtn) userMenuBtn.textContent = username;
        } else {
            // User is guest
            if (guestView) guestView.classList.remove('hidden');
            if (userView) userView.classList.add('hidden');
        }
    }

    function openModal(mode) {
        authModal.classList.remove('hidden');
        switchForm(mode);
        authError.textContent = ''; // Clear previous errors
    }

    function closeModal() {
        authModal.classList.add('hidden');
        loginForm.reset();
        registerForm.reset();
    }

    function switchForm(mode) {
        authError.textContent = '';
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

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Success: Save token and update UI
            localStorage.setItem('jwt', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('userId', data.userId);
            
            closeModal();
            checkLoginState();
            // Optional: Reload page to update any specifics
            // window.location.reload(); 

        } catch (error) {
            authError.textContent = error.message;
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        authError.textContent = 'Creating account...';

        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Note: We are sending email, but backend needs update to store it.
                // For now, backend will ignore email and just create user.
                body: JSON.stringify({ username, password, email }) 
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Success: Switch to login form and show message
            switchForm('login');
            authError.style.color = '#21d07a'; // Green for success
            authError.textContent = 'Account created! Please log in.';
            registerForm.reset();
            
            // Reset error color after a few seconds
            setTimeout(() => { authError.style.color = ''; authError.textContent = ''; }, 3000);

        } catch (error) {
            authError.textContent = error.message;
        }
    }

    function handleLogout(e) {
        e.preventDefault();
        // 1. Clear local storage
        localStorage.removeItem('jwt');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');

        // 2. Update UI immediately
        checkLoginState();

        // 3. If on a protected page (like account.html), redirect to home
        if (window.location.pathname.includes('account.html') || window.location.pathname.includes('watchlist.html')) {
            window.location.href = 'index.html';
        }
    }
});