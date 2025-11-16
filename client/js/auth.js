// User Authentication Functions
function setupUserAuth() {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserUI();
    }

    // Login modal
    const loginModal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('loginBtn');
    const loginForm = document.getElementById('loginForm');
    const loginClose = loginModal.querySelector('.close');

    loginBtn.addEventListener('click', () => {
        loginModal.classList.add('show');
    });

    loginClose.addEventListener('click', () => {
        loginModal.classList.remove('show');
        document.getElementById('loginError').classList.remove('show');
        loginForm.reset();
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const errorDiv = document.getElementById('loginError');

        try {
            const data = await loginUser(username, password);
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUserUI();
            loginModal.classList.remove('show');
            loginForm.reset();
            errorDiv.classList.remove('show');
        } catch (error) {
            errorDiv.textContent = error.message || 'Login failed';
            errorDiv.classList.add('show');
        }
    });

    // Register modal
    const registerModal = document.getElementById('registerModal');
    const registerBtn = document.getElementById('registerBtn');
    const registerForm = document.getElementById('registerForm');
    const registerClose = registerModal.querySelector('.close');

    registerBtn.addEventListener('click', () => {
        registerModal.classList.add('show');
    });

    registerClose.addEventListener('click', () => {
        registerModal.classList.remove('show');
        document.getElementById('registerError').classList.remove('show');
        registerForm.reset();
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const errorDiv = document.getElementById('registerError');

        try {
            await registerUser(username, email, password);
            
            // Auto login after registration
            const loginData = await loginUser(username, password);
            currentUser = loginData.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateUserUI();
            registerModal.classList.remove('show');
            registerForm.reset();
            errorDiv.classList.remove('show');
        } catch (error) {
            errorDiv.textContent = error.message || 'Registration failed';
            errorDiv.classList.add('show');
        }
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateUserUI();
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.classList.remove('show');
        }
        if (e.target === registerModal) {
            registerModal.classList.remove('show');
        }
    });

    // Setup Settings Modal
    setupUserSettings();
}

function updateUserUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userInfo = document.getElementById('userInfo');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const applyPreferencesBtn = document.getElementById('applyPreferencesBtn');
    
    if (currentUser) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        usernameDisplay.textContent = currentUser.username;
        
        if (currentUser.preferences && currentUser.preferences.favoriteFacilities && currentUser.preferences.favoriteFacilities.length > 0) {
            applyPreferencesBtn.style.display = 'block';
        } else {
            applyPreferencesBtn.style.display = 'none';
        }
        
        if (currentUser.preferences) {
            applyUserPreferences();
        } else {
            loadUserPreferences().then(() => {
                if (currentUser && currentUser.preferences) {
                    applyUserPreferences();
                    if (currentUser.preferences.favoriteFacilities && currentUser.preferences.favoriteFacilities.length > 0) {
                        applyPreferencesBtn.style.display = 'block';
                    }
                }
            });
        }
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        userInfo.style.display = 'none';
        applyPreferencesBtn.style.display = 'none';
        
        // Reset filters when logging out
        currentFilters.facilityType = 'all';
        currentFilters.borough = 'all';
        currentFilters.showTrails = 'all';
        
        document.querySelectorAll('#facilityFilters .filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === 'all') btn.classList.add('active');
        });
        document.querySelectorAll('#boroughFilters .filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.borough === 'all') btn.classList.add('active');
        });
        document.querySelectorAll('#trailFilters .filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.trail === 'all') btn.classList.add('active');
        });
        applyFilters();
    }
}


