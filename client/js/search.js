// Search Functionality
function setupSearch() {
    const searchInput = document.getElementById('parkSearch');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');
    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            searchResults.classList.remove('show');
            currentFilters.searchTerm = '';
            applyFilters();
            return;
        }

        searchTimeout = setTimeout(() => {
            performSearch(query);
            currentFilters.searchTerm = query;
            applyFilters();
        }, 300);
    });

    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            currentFilters.searchTerm = query;
            performSearch(query, true);
            applyFilters();
        } else {
            searchResults.classList.remove('show');
            currentFilters.searchTerm = '';
            applyFilters();
        }
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                currentFilters.searchTerm = query;
                performSearch(query, true);
                applyFilters();
            }
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('show');
        }
    });
}

function performSearch(query, selectFirst = false) {
    const searchLower = query.toLowerCase().trim();
    if (!searchLower) {
        document.getElementById('searchResults').classList.remove('show');
        currentFilters.searchTerm = '';
        applyFilters();
        return;
    }
    
    const results = allParks.filter(park => 
        (park.park_name && park.park_name.toLowerCase().includes(searchLower)) ||
        (park.park_id && park.park_id.toLowerCase().includes(searchLower)) ||
        (park.borough && park.borough.toLowerCase().includes(searchLower)) ||
        (park.park_type && park.park_type.toLowerCase().includes(searchLower))
    ).slice(0, 10);

    const searchResults = document.getElementById('searchResults');
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No parks found</div>';
        searchResults.classList.add('show');
        return;
    }

    if (selectFirst && results.length > 0) {
        selectParkFromSearch(results[0]);
        return;
    }

    searchResults.innerHTML = results.map(park => {
        const facilities = getFacilitiesForPark(park.park_id);
        const facilityCount = facilities.length;
        return `
            <div class="search-result-item" data-park-id="${park.park_id}">
                <div class="result-name">${park.park_name || 'Unknown Park'}</div>
                <div class="result-details">${park.borough || ''} ${park.borough && park.park_type ? '•' : ''} ${park.park_type || ''} ${facilityCount > 0 ? `• ${facilityCount} facilities` : ''}</div>
            </div>
        `;
    }).join('');

    searchResults.querySelectorAll('.search-result-item').forEach(item => {
        const parkId = item.dataset.parkId;
        if (parkId) {
            item.addEventListener('click', () => {
                const park = results.find(p => p.park_id === parkId);
                if (park) {
                    selectParkFromSearch(park);
                }
            });
        }
    });

    searchResults.classList.add('show');
}

async function selectParkFromSearch(park) {
    const searchInput = document.getElementById('parkSearch');
    const searchResults = document.getElementById('searchResults');
    
    searchInput.value = park.park_name || park.park_id;
    currentFilters.searchTerm = '';
    
    searchResults.classList.remove('show');
    
    await showParkInfo(park);
    applyFilters();
    addSearchMarker(park);
    
    const markerData = parkMarkers.find(({ park: p }) => p.park_id === park.park_id);
    if (markerData) {
        const parkFacilities = getFacilitiesForPark(park.park_id);
        const parkTrails = getTrailsForPark(park.park_id);
        markerData.marker.setIcon(createCustomIcon(parkFacilities.length > 0, parkFacilities.length, true, parkTrails.length > 0));
        setTimeout(() => {
            markerData.marker.setIcon(createCustomIcon(parkFacilities.length > 0, parkFacilities.length, false, parkTrails.length > 0));
        }, 3000);
    }
}

