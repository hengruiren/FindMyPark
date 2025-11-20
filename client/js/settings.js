// User Settings Functions
function setupUserSettings() {
    const settingsModal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsForm = document.getElementById('settingsForm');
    const settingsClose = settingsModal.querySelector('.close');

    settingsBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        document.getElementById('settingsUsername').textContent = currentUser.username || 'N/A';
        document.getElementById('settingsEmail').textContent = currentUser.email || 'N/A';
        await loadUserPreferences();
        // Load favorites when opening settings
        if (typeof displayFavoritesList === 'function') {
            await displayFavoritesList();
        }
        settingsModal.classList.add('show');
    });

    settingsClose.addEventListener('click', () => {
        settingsModal.classList.remove('show');
        document.getElementById('settingsError').classList.remove('show');
        document.getElementById('settingsSuccess').classList.remove('show');
    });

    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const favoriteFacilities = Array.from(document.querySelectorAll('#favoriteFacilities input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        const showOnlyFavorites = document.getElementById('showOnlyFavorites').checked;
        
        const preferredBoroughs = Array.from(document.querySelectorAll('#preferredBoroughs input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        const preferredParkTypes = Array.from(document.querySelectorAll('#preferredParkTypes input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        
        const preferredWaterfront = document.querySelector('input[name="preferredWaterfront"]:checked')?.value;
        const waterfrontValue = preferredWaterfront === 'yes' ? true : preferredWaterfront === 'no' ? false : null;
        
        const minRating = parseFloat(document.getElementById('minRating').value) || 0;
        
        const preferredSize = document.querySelector('input[name="preferredSize"]:checked')?.value || null;

        const preferences = {
            favoriteFacilities,
            showOnlyFavorites,
            preferredBoroughs,
            preferredParkTypes,
            preferredWaterfront: waterfrontValue,
            minRating,
            preferredSize
        };

        const errorDiv = document.getElementById('settingsError');
        const successDiv = document.getElementById('settingsSuccess');

        try {
            await updateUserPreferences(currentUser.username, preferences);
            
            errorDiv.classList.remove('show');
            successDiv.textContent = 'Settings saved successfully!';
            successDiv.classList.add('show');
            
            if (currentUser) {
                currentUser.preferences = preferences;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }

            updateUserUI();
            applyUserPreferences();

            setTimeout(() => {
                settingsModal.classList.remove('show');
                successDiv.classList.remove('show');
            }, 1500);
        } catch (error) {
            successDiv.classList.remove('show');
            errorDiv.textContent = error.message || 'Failed to save settings';
            errorDiv.classList.add('show');
        }
    });

    // Delete Account Button
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    deleteAccountBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        
        const confirmDelete = confirm(`Are you sure you want to delete your account "${currentUser.username}"? This action cannot be undone.`);
        if (!confirmDelete) return;

        try {
            await deleteUser(currentUser.username);
            
            currentUser = null;
            localStorage.removeItem('currentUser');
            updateUserUI();
            settingsModal.classList.remove('show');
            alert('Account deleted successfully.');
        } catch (error) {
            const errorDiv = document.getElementById('settingsError');
            errorDiv.textContent = error.message || 'Failed to delete account';
            errorDiv.classList.add('show');
        }
    });

    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('show');
        }
    });
}

async function loadUserPreferences() {
    if (!currentUser) return;

    try {
        let preferences = currentUser.preferences || null;

        if (!preferences) {
            preferences = await fetchUserPreferences(currentUser.username);
        }

        if (preferences) {
            const facilityCheckboxes = document.querySelectorAll('#favoriteFacilities input[type="checkbox"]');
            facilityCheckboxes.forEach(cb => {
                cb.checked = preferences.favoriteFacilities?.includes(cb.value) || false;
                updateCheckboxStyle(cb);
            });

            document.getElementById('showOnlyFavorites').checked = preferences.showOnlyFavorites || false;
            
            // Load borough preferences
            if (preferences.preferredBoroughs) {
                const boroughCheckboxes = document.querySelectorAll('#preferredBoroughs input[type="checkbox"]');
                boroughCheckboxes.forEach(cb => {
                    cb.checked = preferences.preferredBoroughs.includes(cb.value) || false;
                    updateCheckboxStyle(cb);
                });
            }
            
            // Load park type preferences
            if (preferences.preferredParkTypes) {
                const parkTypeCheckboxes = document.querySelectorAll('#preferredParkTypes input[type="checkbox"]');
                parkTypeCheckboxes.forEach(cb => {
                    cb.checked = preferences.preferredParkTypes.includes(cb.value) || false;
                    updateCheckboxStyle(cb);
                });
            }
            
            // Load waterfront preference
            if (preferences.preferredWaterfront !== null && preferences.preferredWaterfront !== undefined) {
                const waterfrontValue = preferences.preferredWaterfront ? 'yes' : 'no';
                const waterfrontRadio = document.querySelector(`input[name="preferredWaterfront"][value="${waterfrontValue}"]`);
                if (waterfrontRadio) waterfrontRadio.checked = true;
            }
            
            // Load min rating
            if (preferences.minRating !== undefined) {
                document.getElementById('minRating').value = preferences.minRating;
            }
            
            // Load size preference
            if (preferences.preferredSize) {
                const sizeRadio = document.querySelector(`input[name="preferredSize"][value="${preferences.preferredSize}"]`);
                if (sizeRadio) sizeRadio.checked = true;
            }
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
    }
}

function updateCheckboxStyle(checkbox) {
    const container = checkbox.closest('.settings-checkbox');
    if (checkbox.checked) {
        container.classList.add('checked');
    } else {
        container.classList.remove('checked');
    }
}

async function initializeSettingsForm() {
    if (allFacilities.length === 0 || !map) {
        setTimeout(initializeSettingsForm, 500);
        return;
    }

    const favoriteFacilities = document.getElementById('favoriteFacilities');
    const facilityTypes = [...new Set(allFacilities.map(f => f.facility_type))].sort();

    favoriteFacilities.innerHTML = facilityTypes.map(type => `
        <div class="settings-checkbox">
            <input type="checkbox" id="facility-${type}" value="${type}" 
                   onchange="updateCheckboxStyle(this)">
            <label for="facility-${type}">${type}</label>
        </div>
    `).join('');
    
    // Initialize borough preferences
    try {
        const boroughs = await fetchBoroughs();
        const boroughList = document.getElementById('preferredBoroughs');
        if (boroughList) {
            boroughList.innerHTML = boroughs.map(b => `
                <div class="settings-checkbox">
                    <input type="checkbox" id="borough-${b.borough}" value="${b.borough}" 
                           onchange="updateCheckboxStyle(this)">
                    <label for="borough-${b.borough}">${b.borough}</label>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading boroughs for settings:', error);
    }
    
    // Initialize park type preferences
    try {
        const parkTypes = await fetchParkTypes();
        const parkTypeList = document.getElementById('preferredParkTypes');
        if (parkTypeList) {
            parkTypeList.innerHTML = parkTypes.filter(pt => pt.park_type).map(pt => `
                <div class="settings-checkbox">
                    <input type="checkbox" id="parkType-${pt.park_type}" value="${pt.park_type}" 
                           onchange="updateCheckboxStyle(this)">
                    <label for="parkType-${pt.park_type}">${pt.park_type}</label>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading park types for settings:', error);
    }
}

function applyUserPreferences(forceApply = false) {
    if (!currentUser || !currentUser.preferences) {
        if (currentUser) {
            loadUserPreferences().then(() => {
                if (currentUser && currentUser.preferences) {
                    applyUserPreferences(forceApply);
                }
            });
        }
        return;
    }

    const prefs = currentUser.preferences;

    if (prefs.favoriteFacilities && prefs.favoriteFacilities.length > 0) {
        if (prefs.showOnlyFavorites || forceApply) {
            // Apply all favorite facilities (multiple types)
            const facilityButtons = document.querySelectorAll('#facilityFilters .filter-btn');
            
            // Remove active from all buttons
            facilityButtons.forEach(b => b.classList.remove('active'));
            
            // Activate buttons for all favorite facilities
            let anyFound = false;
            facilityButtons.forEach(btn => {
                if (prefs.favoriteFacilities.includes(btn.dataset.type)) {
                    btn.classList.add('active');
                    anyFound = true;
                }
            });
            
            // Set filter to array of favorite facility types
            if (anyFound) {
                currentFilters.facilityType = prefs.favoriteFacilities;
                applyFilters();
            } else {
                // If no matching buttons found, reset to 'all'
                const allBtn = document.querySelector('#facilityFilters [data-type="all"]');
                if (allBtn) {
                    allBtn.classList.add('active');
                    currentFilters.facilityType = 'all';
                    applyFilters();
                }
            }
        }
    }
}

