// Floating Action Buttons Functions
function setupFloatingButtons() {
    // Recommendations floating button
    const recommendationsFloatingBtn = document.getElementById('recommendationsFloatingBtn');
    const recommendationsModal = document.getElementById('recommendationsModal');
    const loadRecommendationsBtn = document.getElementById('loadRecommendationsBtn');
    
    if (recommendationsFloatingBtn && recommendationsModal) {
        recommendationsFloatingBtn.addEventListener('click', () => {
            if (!currentUser) {
                alert('Please login to get personalized recommendations');
                return;
            }
            recommendationsModal.classList.add('show');
        });
    }
    
    // Favorites floating button
    const favoritesFloatingBtn = document.getElementById('favoritesFloatingBtn');
    const favoritesModal = document.getElementById('favoritesModal');
    
    if (favoritesFloatingBtn && favoritesModal) {
        favoritesFloatingBtn.addEventListener('click', async () => {
            if (!currentUser) {
                alert('Please login to view favorites');
                return;
            }
            favoritesModal.classList.add('show');
            if (typeof displayFavoritesListModal === 'function') {
                await displayFavoritesListModal();
            }
        });
    }
    
    // Close modals
    const recommendationsClose = recommendationsModal?.querySelector('.close');
    const favoritesClose = favoritesModal?.querySelector('.close');
    
    if (recommendationsClose) {
        recommendationsClose.addEventListener('click', () => {
            recommendationsModal.classList.remove('show');
        });
    }
    
    if (favoritesClose) {
        favoritesClose.addEventListener('click', () => {
            favoritesModal.classList.remove('show');
        });
    }
    
    // Close modals when clicking outside
    if (recommendationsModal) {
        window.addEventListener('click', (e) => {
            if (e.target === recommendationsModal) {
                recommendationsModal.classList.remove('show');
            }
        });
    }
    
    if (favoritesModal) {
        window.addEventListener('click', (e) => {
            if (e.target === favoritesModal) {
                favoritesModal.classList.remove('show');
            }
        });
    }
}

function updateFloatingButtons() {
    const recommendationsBtn = document.getElementById('recommendationsFloatingBtn');
    const favoritesBtn = document.getElementById('favoritesFloatingBtn');
    
    if (currentUser) {
        if (recommendationsBtn) {
            recommendationsBtn.style.display = 'flex';
        }
        if (favoritesBtn) {
            favoritesBtn.style.display = 'flex';
        }
        updateFavoritesCount();
    } else {
        if (recommendationsBtn) {
            recommendationsBtn.style.display = 'none';
        }
        if (favoritesBtn) {
            favoritesBtn.style.display = 'none';
        }
    }
}

// Update favorites count when favorites change
function updateFavoritesCount() {
    const favoritesCount = document.getElementById('favoritesCount');
    if (favoritesCount && typeof userFavorites !== 'undefined') {
        const count = userFavorites.length || 0;
        favoritesCount.textContent = count;
        favoritesCount.style.display = count > 0 ? 'block' : 'none';
    }
}

