// Map Initialization and Management
function initMap() {
    map = L.map('map', {
        center: NYC_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true,
        touchZoom: true
    });

    // Use CartoDB Positron tiles for a cleaner, modern look
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    console.log('Map initialized');
}

function resetView() {
    if (!map) return;
    map.setView(NYC_CENTER, DEFAULT_ZOOM, {
        animate: true,
        duration: 0.8
    });
    updateVisibleParks();
}

function updateVisibleParks() {
    if (!map || allParks.length === 0) return;
    
    // Apply filters first to get all filtered parks
    let filteredParks = filterParks(allParks);
    
    // Display all filtered parks
    displayParksOnMap(filteredParks);
}

// Handle window resize
window.addEventListener('resize', () => {
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
});

