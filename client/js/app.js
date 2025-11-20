// Main Application Entry Point
async function loadInitialData() {
    showLoading();
    try {
        // Load parks
        allParks = await fetchParks();
        console.log(`Loaded ${allParks.length} parks`);

        // Load facility types and boroughs
        const facilityTypes = await fetchFacilityTypes();
        populateFacilityFilters(facilityTypes);

        const boroughs = await fetchBoroughs();
        populateBoroughFilters(boroughs);
        
        setupTrailFilters();

        // Load statistics
        await loadStatistics();

        // Load facilities and trails
        allFacilities = await fetchFacilities();
        console.log(`Loaded ${allFacilities.length} facilities`);
        
        allTrails = await fetchTrails();
        console.log(`Loaded ${allTrails.length} trails`);

        // Create mappings
        createParkFacilityMapping();
        createParkTrailMapping();

        // Initialize settings form
        await initializeSettingsForm();

        // Display all parks on map initially
        displayParksOnMap(allParks);
        
        // Set up map move listener
        map.on('moveend', updateVisibleParks);
        map.on('zoomend', updateVisibleParks);

        updateStats();

    } catch (error) {
        console.error('Error loading data:', error);
        alert('Failed to load data. Please check server connection.');
    } finally {
        hideLoading();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing FindMyPark NYC...');
    
    // Initialize map
    initMap();

    // Setup search
    setupSearch();

    // Setup user authentication
    setupUserAuth();

    // Setup recommendations
    setupRecommendations();

    // Setup floating buttons
    if (typeof setupFloatingButtons === 'function') {
        setupFloatingButtons();
    }

    // Load favorites if user is logged in
    if (currentUser && typeof loadUserFavorites === 'function') {
        loadUserFavorites();
    }

    // Update floating buttons
    if (typeof updateFloatingButtons === 'function') {
        updateFloatingButtons();
    }

    // Setup buttons
    document.getElementById('resetViewBtn').addEventListener('click', resetView);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
    
    // Apply Preferences Button
    const applyPreferencesBtn = document.getElementById('applyPreferencesBtn');
    applyPreferencesBtn.addEventListener('click', () => {
        if (currentUser) {
            applyUserPreferences(true); // Force apply
        }
    });

    // Load data
    loadInitialData();
});
