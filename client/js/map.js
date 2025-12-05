// Map Initialization and Management
let baseMaps = {};
let currentBaseLayer = null;

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

    // Standard map layer (CartoDB Positron)
    baseMaps['Standard'] = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    });

    // Satellite imagery layer (Esri World Imagery - free and no API key required)
    baseMaps['Satellite'] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    });

    // Add default layer (Standard)
    currentBaseLayer = baseMaps['Standard'];
    currentBaseLayer.addTo(map);

    // Create layer control button
    createLayerControl();

    console.log('Map initialized with layer switching');
}

// Create layer control button
function createLayerControl() {
    // Create a custom layer control button at bottom-left
    const layerControl = L.control({ position: 'bottomleft' });
    
    layerControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control layer-control');
        const btn = L.DomUtil.create('button', 'layer-toggle-btn');
        btn.id = 'layerToggleBtn';
        btn.title = 'Switch to Satellite View';
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                <path d="M2 12h20"></path>
            </svg>
        `;
        div.appendChild(btn);
        
        // Add click handler
        L.DomEvent.on(btn, 'click', L.DomEvent.stop);
        L.DomEvent.on(btn, 'click', toggleMapLayer, btn);
        
        // Prevent map click when clicking button
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.on(div, 'mousewheel', L.DomEvent.stopPropagation);
        
        // Update button appearance after adding to map
        setTimeout(() => {
            updateLayerButton();
        }, 100);
        
        return div;
    };
    
    layerControl.addTo(map);
}

// Toggle between standard and satellite layers
function toggleMapLayer() {
    if (!map || !currentBaseLayer) return;
    
    // Remove current layer
    map.removeLayer(currentBaseLayer);
    
    // Switch to the other layer
    if (currentBaseLayer === baseMaps['Standard']) {
        currentBaseLayer = baseMaps['Satellite'];
    } else {
        currentBaseLayer = baseMaps['Standard'];
    }
    
    // Add new layer
    currentBaseLayer.addTo(map);
    
    // Update button appearance
    updateLayerButton();
    
    console.log('Switched to:', currentBaseLayer === baseMaps['Satellite'] ? 'Satellite' : 'Standard');
}

// Update layer toggle button appearance
function updateLayerButton() {
    const btn = document.getElementById('layerToggleBtn');
    if (!btn) return;
    
    const isSatellite = currentBaseLayer === baseMaps['Satellite'];
    btn.title = isSatellite ? 'Switch to Standard Map' : 'Switch to Satellite View';
    btn.classList.toggle('satellite-active', isSatellite);
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




