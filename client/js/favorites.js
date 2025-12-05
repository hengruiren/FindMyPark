// Favorites Functions
async function loadUserFavorites() {
    if (!currentUser) {
        userFavorites = [];
        if (typeof updateFloatingButtons === 'function') {
            updateFloatingButtons();
        }
        return;
    }

    try {
        userFavorites = await fetchUserFavorites(currentUser.username) || [];
        // Update user object
        if (currentUser) {
            currentUser.favorites = userFavorites;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        updateFavoritesUI();
        if (typeof updateFloatingButtons === 'function') {
            updateFloatingButtons();
        }
    } catch (error) {
        console.error('Error loading favorites:', error);
        userFavorites = [];
        if (typeof updateFloatingButtons === 'function') {
            updateFloatingButtons();
        }
    }
}

async function toggleFavorite(parkId) {
    if (!currentUser) {
        alert('Please login to add favorites');
        return;
    }

    try {
        const wasFavorite = userFavorites.includes(parkId);
        
        if (wasFavorite) {
            await removeFromFavorites(currentUser.username, parkId);
            userFavorites = userFavorites.filter(id => id !== parkId);
        } else {
            await addToFavorites(currentUser.username, parkId);
            userFavorites.push(parkId);
        }

        // Update user object
        if (currentUser) {
            currentUser.favorites = userFavorites;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }

        updateFavoritesUI();
        updateFavoriteButtons();
        
        // Update park info panel if it's currently displayed
        const infoPanel = document.getElementById('infoPanel');
        if (infoPanel && infoPanel.style.display !== 'none') {
            const parkInfo = document.getElementById('parkInfo');
            if (parkInfo) {
                const favoriteBtn = parkInfo.querySelector('.favorite-btn');
                if (favoriteBtn && favoriteBtn.dataset.parkId === parkId) {
                    // Update favorite button directly - check current state
                    const nowFavorite = typeof isFavorite === 'function' ? isFavorite(parkId) : userFavorites.includes(parkId);
                    if (nowFavorite) {
                        favoriteBtn.classList.add('active');
                        favoriteBtn.innerHTML = `
                            <svg class="tag-icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5">
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path>
                                <line x1="7" y1="7" x2="7.01" y2="7"></line>
                            </svg>
                            <span>Saved</span>
                        `;
                    } else {
                        favoriteBtn.classList.remove('active');
                        favoriteBtn.innerHTML = `
                            <svg class="tag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path>
                                <line x1="7" y1="7" x2="7.01" y2="7"></line>
                            </svg>
                            <span>Save</span>
                        `;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        alert('Failed to update favorite: ' + error.message);
    }
}

function isFavorite(parkId) {
    return userFavorites.includes(parkId);
}

function updateFavoritesUI() {
    // Update favorite buttons in park info panels
    updateFavoriteButtons();
    
    // Update favorites section in settings if modal is open
    const favoritesList = document.getElementById('favoritesList');
    if (favoritesList && document.getElementById('settingsModal').classList.contains('show')) {
        displayFavoritesList();
    }
    
    // Update favorites modal if open
    const favoritesListModal = document.getElementById('favoritesListModal');
    if (favoritesListModal && document.getElementById('favoritesModal').classList.contains('show')) {
        displayFavoritesListModal();
    }
    
    // Update floating button count
    if (typeof updateFavoritesCount === 'function') {
        updateFavoritesCount();
    }
}

function updateFavoriteButtons() {
    // Update favorite buttons in all park info panels
    const favoriteButtons = document.querySelectorAll('.favorite-btn');
    favoriteButtons.forEach(btn => {
        const parkId = btn.dataset.parkId;
        if (parkId && isFavorite(parkId)) {
            btn.classList.add('active');
            btn.innerHTML = `
                <svg class="tag-icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                <span>Saved</span>
            `;
        } else {
            btn.classList.remove('active');
            btn.innerHTML = `
                <svg class="tag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path>
                    <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                <span>Save</span>
            `;
        }
    });
}

async function displayFavoritesList() {
    const favoritesList = document.getElementById('favoritesList');
    if (!favoritesList) return;
    
    await renderFavoritesList(favoritesList);
}

async function displayFavoritesListModal() {
    const favoritesListModal = document.getElementById('favoritesListModal');
    if (!favoritesListModal) return;
    
    await renderFavoritesList(favoritesListModal);
}

async function renderFavoritesList(container) {
    if (userFavorites.length === 0) {
        container.innerHTML = '<p class="no-favorites">No favorites yet. Click the "Save" button on any park to add it to your favorites!</p>';
        return;
    }

    try {
        // Fetch park details for favorites
        const favoriteParks = [];
        for (const parkId of userFavorites) {
            const park = allParks.find(p => p.park_id === parkId);
            if (park) {
                favoriteParks.push(park);
            }
        }

        if (favoriteParks.length === 0) {
            container.innerHTML = '<p class="no-favorites">No favorites found.</p>';
            return;
        }

        container.innerHTML = `
            <div class="favorites-grid">
                ${favoriteParks.map(park => {
                    const rating = parseFloat(park.avg_rating) || 0;
                    return `
                        <div class="favorite-item" data-park-id="${park.park_id}">
                            <div class="favorite-header">
                                <h4>${park.park_name}</h4>
                                <button class="remove-favorite-btn" onclick="removeFavoriteFromList('${park.park_id}')" title="Remove from favorites">✕</button>
                            </div>
                            <div class="favorite-info">
                                <p><strong>📍</strong> ${park.borough || 'N/A'}</p>
                                <p><strong>⭐</strong> ${rating > 0 ? rating.toFixed(1) + '/5.0' : 'No rating'}</p>
                                ${park.acres ? `<p><strong>📏</strong> ${parseFloat(park.acres).toFixed(1)} acres</p>` : ''}
                            </div>
                            <button class="view-park-btn" onclick="viewFavoritePark('${park.park_id}')">View on Map</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error displaying favorites:', error);
        container.innerHTML = '<p class="error-message">Error loading favorites.</p>';
    }
}

async function removeFavoriteFromList(parkId) {
    if (!currentUser) return;

    try {
        await removeFromFavorites(currentUser.username, parkId);
        userFavorites = userFavorites.filter(id => id !== parkId);
        
        if (currentUser) {
            currentUser.favorites = userFavorites;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }

        displayFavoritesList();
        displayFavoritesListModal();
        updateFavoriteButtons();
        
        // Update count
        if (typeof updateFavoritesCount === 'function') {
            updateFavoritesCount();
        }
    } catch (error) {
        console.error('Error removing favorite:', error);
        alert('Failed to remove favorite: ' + error.message);
    }
}

async function viewFavoritePark(parkId) {
    // Close favorites modal
    const favoritesModal = document.getElementById('favoritesModal');
    if (favoritesModal) {
        favoritesModal.classList.remove('show');
    }
    
    // Close settings modal if open
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        settingsModal.classList.remove('show');
    }
    
    const park = allParks.find(p => p.park_id === parkId);
    if (!park || !map) {
        console.error('Park not found or map not initialized:', parkId);
        return;
    }
    
    console.log('Viewing favorite park on map:', park.park_name, parkId);
    
    // Get facilities and trails for the park
    let facilities = null;
    let trails = null;
    
    if (typeof getFacilitiesForPark === 'function' && typeof getTrailsForPark === 'function') {
        facilities = getFacilitiesForPark(park.park_id);
        trails = getTrailsForPark(park.park_id);
    }
    
    // If no facilities/trails found locally, try fetching from API
    if ((!facilities || facilities.length === 0) && typeof fetchFacilitiesByPark === 'function') {
        try {
            facilities = await fetchFacilitiesByPark(park.park_id);
            console.log('Fetched facilities from API:', facilities.length);
        } catch (error) {
            console.error('Error fetching facilities:', error);
            facilities = facilities || [];
        }
    }
    
    if ((!trails || trails.length === 0) && typeof fetchTrailsByPark === 'function') {
        try {
            trails = await fetchTrailsByPark(park.park_id);
            console.log('Fetched trails from API:', trails.length);
        } catch (error) {
            console.error('Error fetching trails:', error);
            trails = trails || [];
        }
    }
    
    // IMPORTANT: Show park info in left sidebar FIRST (before map operations)
    if (typeof showParkInfo === 'function') {
        console.log('Calling showParkInfo for:', park.park_name);
        await showParkInfo(park, facilities, trails);
    } else {
        console.error('showParkInfo function not found!');
    }
    
    // Ensure sidebar is visible
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.style.display = 'block';
    }
    
    const infoPanel = document.getElementById('infoPanel');
    if (infoPanel) {
        infoPanel.style.display = 'block';
    }
    
    // Small delay to ensure UI updates, then add search marker and center map
    setTimeout(() => {
        if (typeof addSearchMarker === 'function') {
            // Use addSearchMarker to create red highlighted marker
            addSearchMarker(park);
        } else {
            // Fallback: just center the map
            map.setView([parseFloat(park.latitude), parseFloat(park.longitude)], SEARCH_ZOOM || 15, {
                animate: true,
                duration: 0.8
            });
        }
    }, 100);
}

