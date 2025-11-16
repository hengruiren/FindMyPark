// Filtering Logic
function filterParks(parks) {
    let filtered = [...parks];

    // Filter by facility type (supports single type or array of types)
    if (currentFilters.facilityType !== 'all') {
        const parksWithFacility = new Set();
        const facilityTypes = Array.isArray(currentFilters.facilityType) 
            ? currentFilters.facilityType 
            : [currentFilters.facilityType];
        
        allFacilities
            .filter(f => facilityTypes.includes(f.facility_type))
            .forEach(f => {
                const parkId = String(f.park_id || '').trim();
                if (parkId) parksWithFacility.add(parkId);
            });
        
        filtered = filtered.filter(p => {
            const parkId = String(p.park_id || '').trim();
            return parkId && parksWithFacility.has(parkId);
        });
    }

    // Filter by trails
    if (currentFilters.showTrails === 'trails') {
        const parksWithTrails = new Set();
        allTrails.forEach(t => {
            const parkId = String(t.park_id || '').trim();
            if (parkId) parksWithTrails.add(parkId);
        });
        
        filtered = filtered.filter(p => {
            const parkId = String(p.park_id || '').trim();
            return parkId && parksWithTrails.has(parkId);
        });
    } else if (currentFilters.showTrails === 'only-trails') {
        const parksWithTrails = new Set();
        allTrails.forEach(t => {
            const parkId = String(t.park_id || '').trim();
            if (parkId) parksWithTrails.add(parkId);
        });
        
        const parksWithFacilities = new Set();
        allFacilities.forEach(f => {
            const parkId = String(f.park_id || '').trim();
            if (parkId) parksWithFacilities.add(parkId);
        });
        
        filtered = filtered.filter(p => {
            const parkId = String(p.park_id || '').trim();
            return parkId && parksWithTrails.has(parkId) && !parksWithFacilities.has(parkId);
        });
    }

    // Filter by borough
    if (currentFilters.borough !== 'all') {
        filtered = filtered.filter(p => p.borough === currentFilters.borough);
    }

    // Filter by search term
    if (currentFilters.searchTerm && currentFilters.searchTerm.trim()) {
        const searchLower = currentFilters.searchTerm.toLowerCase().trim();
        filtered = filtered.filter(p => 
            (p.park_name && p.park_name.toLowerCase().includes(searchLower)) ||
            (p.park_id && p.park_id.toLowerCase().includes(searchLower)) ||
            (p.borough && p.borough.toLowerCase().includes(searchLower)) ||
            (p.park_type && p.park_type.toLowerCase().includes(searchLower))
        );
    }

    return filtered;
}

function applyFilters() {
    updateVisibleParks();
}

function clearFilters() {
    currentFilters = {
        facilityType: 'all',
        borough: 'all',
        searchTerm: '',
        showTrails: 'all'
    };

    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.type === 'all' || btn.dataset.borough === 'all' || btn.dataset.trail === 'all') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    document.getElementById('parkSearch').value = '';
    document.getElementById('searchResults').classList.remove('show');
    
    removeSearchMarker();
    applyFilters();
}

function populateFacilityFilters(facilityTypes) {
    const container = document.getElementById('facilityFilters');
    
    const allBtn = container.querySelector('[data-type="all"]');
    if (allBtn) {
        allBtn.addEventListener('click', () => {
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            allBtn.classList.add('active');
            currentFilters.facilityType = 'all';
            applyFilters();
        });
    }
    
    facilityTypes.forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = type.facility_type;
        btn.dataset.type = type.facility_type;
        btn.addEventListener('click', () => {
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilters.facilityType = type.facility_type;
            applyFilters();
        });
        container.appendChild(btn);
    });
}

function setupTrailFilters() {
    const container = document.getElementById('trailFilters');
    
    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilters.showTrails = btn.dataset.trail;
            applyFilters();
        });
    });
}

function populateBoroughFilters(boroughs) {
    const container = document.getElementById('boroughFilters');
    
    const allBtn = container.querySelector('[data-borough="all"]');
    if (allBtn) {
        allBtn.addEventListener('click', () => {
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            allBtn.classList.add('active');
            currentFilters.borough = 'all';
            applyFilters();
        });
    }
    
    boroughs.forEach(borough => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = borough.borough;
        btn.dataset.borough = borough.borough;
        btn.addEventListener('click', () => {
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilters.borough = borough.borough;
            applyFilters();
        });
        container.appendChild(btn);
    });
}

function createParkFacilityMapping() {
    parkFacilityMap = {};
    let skippedCount = 0;
    
    allFacilities.forEach(facility => {
        const parkId = String(facility.park_id || '').trim();
        if (!parkId || parkId === 'undefined' || parkId === 'null') {
            skippedCount++;
            return;
        }
        
        if (!parkFacilityMap[parkId]) {
            parkFacilityMap[parkId] = [];
        }
        parkFacilityMap[parkId].push(facility);
    });
    
    const parkIdsWithFacilities = Object.keys(parkFacilityMap).length;
    const totalMappedFacilities = Object.values(parkFacilityMap).reduce((sum, facilities) => sum + facilities.length, 0);
    console.log(`Park-Facility mapping: ${parkIdsWithFacilities} parks with facilities, ${totalMappedFacilities} total facilities mapped, ${skippedCount} skipped`);
}

function getFacilitiesForPark(parkId) {
    if (!parkId) return [];
    const normalizedParkId = String(parkId).trim();
    return parkFacilityMap[normalizedParkId] || [];
}

function createParkTrailMapping() {
    parkTrailMap = {};
    let skippedCount = 0;
    
    allTrails.forEach(trail => {
        const parkId = String(trail.park_id || '').trim();
        if (!parkId || parkId === 'undefined' || parkId === 'null') {
            skippedCount++;
            return;
        }
        
        if (!parkTrailMap[parkId]) {
            parkTrailMap[parkId] = [];
        }
        parkTrailMap[parkId].push(trail);
    });
    
    const parkIdsWithTrails = Object.keys(parkTrailMap).length;
    const totalMappedTrails = Object.values(parkTrailMap).reduce((sum, trails) => sum + trails.length, 0);
    console.log(`Park-Trail mapping: ${parkIdsWithTrails} parks with trails, ${totalMappedTrails} total trails mapped, ${skippedCount} skipped`);
}

function getTrailsForPark(parkId) {
    if (!parkId) return [];
    const normalizedParkId = String(parkId).trim();
    return parkTrailMap[normalizedParkId] || [];
}

