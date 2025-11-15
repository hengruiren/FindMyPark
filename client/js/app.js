// API Base URL
const API_BASE = 'http://localhost:3000/api';

// Global Variables
let map;
let parkMarkers = [];
let allParks = [];
let allFacilities = [];
let allTrails = [];
let currentUser = null;
let currentFilters = {
    facilityType: 'all',
    borough: 'all',
    searchTerm: '',
    showTrails: 'all'
};

// Initialize Map
function initMap() {
    // New York City center coordinates
    const nycCenter = [40.7128, -73.9352];
    
    // Create map with better initial view
    map = L.map('map', {
        center: nycCenter,
        zoom: 11,
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

// Update visible parks based on map bounds
function updateVisibleParks() {
    if (!map || allParks.length === 0) return;
    
    // Apply filters first to get all filtered parks
    let filteredParks = filterParks(allParks);
    
    // Then filter by map bounds (optional - can display all or just visible ones)
    const bounds = map.getBounds();
    // Show all filtered parks, not just visible ones
    // If you want to show only visible parks, uncomment the next lines:
    // filteredParks = filteredParks.filter(park => {
    //     if (!park.latitude || !park.longitude) return false;
    //     const lat = parseFloat(park.latitude);
    //     const lng = parseFloat(park.longitude);
    //     return bounds.contains([lat, lng]);
    // });
    
    // Display all filtered parks
    displayParksOnMap(filteredParks);
}

// Filter parks based on current filters
function filterParks(parks) {
    let filtered = [...parks];

    // Filter by facility type
    if (currentFilters.facilityType !== 'all') {
        const parksWithFacility = new Set();
        allFacilities
            .filter(f => f.facility_type === currentFilters.facilityType)
            .forEach(f => {
                // Normalize park_id for comparison
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
        // Show parks that have trails (may also have facilities)
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
        // Show parks that have trails but NO facilities
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

// Load Initial Data
async function loadInitialData() {
    showLoading();
    try {
        // Load parks - get all parks without limit
        const parksResponse = await fetch(`${API_BASE}/parks?limit=10000`);
        if (!parksResponse.ok) throw new Error('Failed to load parks');
        allParks = await parksResponse.json();
        console.log(`Loaded ${allParks.length} parks`);

        // Load facility types
        const facilityTypesResponse = await fetch(`${API_BASE}/facilities/types`);
        if (!facilityTypesResponse.ok) throw new Error('Failed to load facility types');
        const facilityTypes = await facilityTypesResponse.json();
        populateFacilityFilters(facilityTypes);

        // Load boroughs
        const boroughsResponse = await fetch(`${API_BASE}/parks/boroughs`);
        if (!boroughsResponse.ok) throw new Error('Failed to load boroughs');
        const boroughs = await boroughsResponse.json();
        populateBoroughFilters(boroughs);
        
        // Setup trail filters
        setupTrailFilters();

        // Load statistics
        await loadStatistics();

        // Load facilities for filtering - get ALL facilities without limit
        const facilitiesResponse = await fetch(`${API_BASE}/facilities?limit=10000`);
        if (!facilitiesResponse.ok) throw new Error('Failed to load facilities');
        allFacilities = await facilitiesResponse.json();
        console.log(`Loaded ${allFacilities.length} facilities`);
        
        // Debug: Check basketball facilities
        const basketballFacilities = allFacilities.filter(f => f.facility_type === 'Basketball');
        const basketballParks = new Set(basketballFacilities.map(f => {
            const id = String(f.park_id || '').trim();
            return id && id !== 'undefined' && id !== 'null' ? id : null;
        }).filter(id => id));
        console.log(`Basketball facilities: ${basketballFacilities.length}, Unique parks: ${basketballParks.size}`);

        // Load trails - get ALL trails without limit
        const trailsResponse = await fetch(`${API_BASE}/trails?limit=10000`);
        if (!trailsResponse.ok) throw new Error('Failed to load trails');
        allTrails = await trailsResponse.json();
        console.log(`Loaded ${allTrails.length} trails`);

        // Create park-facility mapping
        createParkFacilityMapping();
        
        // Create park-trail mapping
        createParkTrailMapping();

        // Initialize settings form
        await initializeSettingsForm();

        // Display all parks on map initially (no filters)
        displayParksOnMap(allParks);
        
        // Set up map move listener to update when map moves
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

// Populate Facility Filters
function populateFacilityFilters(facilityTypes) {
    const container = document.getElementById('facilityFilters');
    
    // Set up click handler for "All" button (already in HTML)
    const allBtn = container.querySelector('[data-type="all"]');
    if (allBtn) {
        allBtn.addEventListener('click', () => {
            // Remove active from all facility buttons
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Add active to "All" button
            allBtn.classList.add('active');
            currentFilters.facilityType = 'all';
            applyFilters();
        });
    }
    
    // Add facility type buttons
    facilityTypes.forEach(type => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = type.facility_type;
        btn.dataset.type = type.facility_type;
        btn.addEventListener('click', () => {
            // Remove active from all facility buttons
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');
            currentFilters.facilityType = type.facility_type;
            applyFilters();
        });
        container.appendChild(btn);
    });
}

// Setup Trail Filters
function setupTrailFilters() {
    const container = document.getElementById('trailFilters');
    
    container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all trail filter buttons
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');
            currentFilters.showTrails = btn.dataset.trail;
            applyFilters();
        });
    });
}

// Populate Borough Filters
function populateBoroughFilters(boroughs) {
    const container = document.getElementById('boroughFilters');
    
    // Set up click handler for "All" button (already in HTML)
    const allBtn = container.querySelector('[data-borough="all"]');
    if (allBtn) {
        allBtn.addEventListener('click', () => {
            // Remove active from all borough buttons
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Add active to "All" button
            allBtn.classList.add('active');
            currentFilters.borough = 'all';
            applyFilters();
        });
    }
    
    // Add borough buttons
    boroughs.forEach(borough => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.textContent = borough.borough;
        btn.dataset.borough = borough.borough;
        btn.addEventListener('click', () => {
            // Remove active from all borough buttons
            container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');
            currentFilters.borough = borough.borough;
            applyFilters();
        });
        container.appendChild(btn);
    });
}

// Create Park-Facility Mapping
let parkFacilityMap = {};

function createParkFacilityMapping() {
    parkFacilityMap = {};
    let skippedCount = 0;
    
    allFacilities.forEach(facility => {
        // Normalize park_id (trim and ensure string)
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
    
    // Debug: log mapping statistics
    const parkIdsWithFacilities = Object.keys(parkFacilityMap).length;
    const totalMappedFacilities = Object.values(parkFacilityMap).reduce((sum, facilities) => sum + facilities.length, 0);
    console.log(`Park-Facility mapping: ${parkIdsWithFacilities} parks with facilities, ${totalMappedFacilities} total facilities mapped, ${skippedCount} skipped`);
    
    // Debug: Check sample park_ids
    const sampleParkIds = Object.keys(parkFacilityMap).slice(0, 5);
    console.log(`Sample park_ids in mapping:`, sampleParkIds);
}

// Get facilities for a park (normalized lookup)
function getFacilitiesForPark(parkId) {
    if (!parkId) return [];
    const normalizedParkId = String(parkId).trim();
    return parkFacilityMap[normalizedParkId] || [];
}

// Create Park-Trail Mapping
let parkTrailMap = {};

function createParkTrailMapping() {
    parkTrailMap = {};
    let skippedCount = 0;
    
    allTrails.forEach(trail => {
        // Normalize park_id (trim and ensure string)
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
    
    // Debug: log mapping statistics
    const parkIdsWithTrails = Object.keys(parkTrailMap).length;
    const totalMappedTrails = Object.values(parkTrailMap).reduce((sum, trails) => sum + trails.length, 0);
    console.log(`Park-Trail mapping: ${parkIdsWithTrails} parks with trails, ${totalMappedTrails} total trails mapped, ${skippedCount} skipped`);
}

// Get trails for a park (normalized lookup)
function getTrailsForPark(parkId) {
    if (!parkId) return [];
    const normalizedParkId = String(parkId).trim();
    return parkTrailMap[normalizedParkId] || [];
}

// Display Parks on Map
function displayParksOnMap(parks) {
    // Clear existing markers
    clearMarkers();

    if (!parks || parks.length === 0) {
        console.log('No parks to display');
        updateStats(0);
        return;
    }

    parks.forEach(park => {
        if (!park.latitude || !park.longitude) return;

        // Normalize park_id for lookup
        const normalizedParkId = String(park.park_id || '').trim();
        if (!normalizedParkId) return;
        
        // Get facilities and trails for this park (with normalized lookup)
        const facilities = getFacilitiesForPark(normalizedParkId);
        const trails = getTrailsForPark(normalizedParkId);

        // Create custom icon with better styling (include trails info)
        const icon = createCustomIcon(facilities.length > 0, facilities.length, false, trails.length > 0);

        // Create marker
        const marker = L.marker([parseFloat(park.latitude), parseFloat(park.longitude)], {
            icon: icon
        });

        // Create popup content
        const popupContent = createPopupContent(park, facilities, trails);

        // Bind popup with longer delay and keep open on hover
        const popup = marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup',
            closeOnClick: false,
            autoClose: false,
            closeOnEscapeKey: true
        });
        
        // Show popup on mouseover, hide on mouseout with delay
        let popupTimeout;
        marker.on('mouseover', function() {
            clearTimeout(popupTimeout);
            marker.openPopup();
        });
        
        marker.on('mouseout', function() {
            // Delay closing popup
            popupTimeout = setTimeout(() => {
                marker.closePopup();
            }, 500); // 500ms delay before closing
        });
        
        // Also handle popup mouse events to keep it open when hovering over popup
        marker.on('popupopen', function() {
            const popupElement = marker.getPopup().getElement();
            if (popupElement) {
                popupElement.addEventListener('mouseenter', () => {
                    clearTimeout(popupTimeout);
                });
                popupElement.addEventListener('mouseleave', () => {
                    popupTimeout = setTimeout(() => {
                        marker.closePopup();
                    }, 500);
                });
            }
        });
        
        // Add click event
        marker.on('click', async () => {
            // Get fresh facilities and trails for this park
            const parkFacilities = getFacilitiesForPark(park.park_id);
            const parkTrails = getTrailsForPark(park.park_id);
            await showParkInfo(park, parkFacilities, parkTrails);
            // Highlight marker
            marker.setIcon(createCustomIcon(parkFacilities.length > 0, parkFacilities.length, true, parkTrails.length > 0));
            setTimeout(() => {
                marker.setIcon(icon);
            }, 1000);
        });

        marker.addTo(map);
        parkMarkers.push({ marker, park });
    });

    console.log(`Displayed ${parkMarkers.length} parks on map`);
    updateStats(parkMarkers.length);
}

// Create Custom Icon with better design
function createCustomIcon(hasFacilities, facilityCount = 0, highlighted = false, hasTrails = false) {
    let color, size, borderWidth;
    
    if (highlighted) {
        color = '#e74c3c';
        size = 20;
        borderWidth = 3;
    } else if (hasFacilities && hasTrails) {
        // Both facilities and trails - use purple/indigo color
        color = '#9b59b6';
        size = facilityCount > 5 ? 18 : 16;
        borderWidth = 3;
    } else if (hasFacilities) {
        // Only facilities - blue
        color = '#3498db';
        size = facilityCount > 5 ? 18 : 15;
        borderWidth = 3;
    } else if (hasTrails) {
        // Only trails - green
        color = '#27ae60';
        size = 15;
        borderWidth = 3;
    } else {
        // Neither - gray
        color = '#95a5a6';
        size = 10;
        borderWidth = 2;
    }
    
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            background-color: ${color};
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            border: ${borderWidth}px solid white;
            box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            transition: all 0.3s ease;
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2]
    });
}

// Create Popup Content
function createPopupContent(park, facilities, trails = null) {
    let html = '<div class="popup-content">';
    html += `<div class="popup-title">${park.park_name || 'Unknown Park'}</div>`;
    html += `<div class="popup-info"><strong>Borough:</strong> ${park.borough || 'N/A'}</div>`;
    html += `<div class="popup-info"><strong>Type:</strong> ${park.park_type || 'N/A'}</div>`;
    
    if (park.acres) {
        html += `<div class="popup-info"><strong>Acres:</strong> ${parseFloat(park.acres).toFixed(2)}</div>`;
    }
    
    if (park.is_waterfront) {
        html += `<div class="popup-info"><strong>Waterfront:</strong> Yes</div>`;
    }
    
    // Get trails if not provided
    if (!trails) {
        trails = getTrailsForPark(park.park_id);
    }
    
    if (trails && trails.length > 0) {
        html += `<div class="popup-info" style="color: #27ae60; font-weight: 600;">🛤️ Has ${trails.length} Trail${trails.length > 1 ? 's' : ''}</div>`;
    }
    
    if (facilities.length > 0) {
        html += '<div class="popup-facilities"><strong>Facilities:</strong><div class="facility-list">';
        const facilityTypes = {};
        facilities.forEach(f => {
            if (!facilityTypes[f.facility_type]) {
                facilityTypes[f.facility_type] = 0;
            }
            facilityTypes[f.facility_type]++;
        });
        
        Object.keys(facilityTypes).forEach(type => {
            const count = facilityTypes[type];
            html += `<span class="popup-facility-tag">${type}${count > 1 ? ` (${count})` : ''}</span>`;
        });
        html += '</div></div>';
    }
    
    html += '</div>';
    return html;
}

// Show Park Info in Sidebar
async function showParkInfo(park, facilities = null, trails = null) {
    const infoPanel = document.getElementById('infoPanel');
    const parkInfo = document.getElementById('parkInfo');
    
    // If facilities not provided or empty, try to get them
    if (!facilities || facilities.length === 0) {
        // Try from mapping first
        facilities = getFacilitiesForPark(park.park_id);
        
        // If still no facilities, try to fetch from API
        if (facilities.length === 0) {
            try {
                const response = await fetch(`${API_BASE}/facilities?park_id=${encodeURIComponent(park.park_id)}&limit=1000`);
                if (response.ok) {
                    const fetchedFacilities = await response.json();
                    facilities = fetchedFacilities || [];
                    console.log(`Fetched ${facilities.length} facilities for park ${park.park_id} from API`);
                }
            } catch (error) {
                console.error('Error fetching facilities:', error);
                facilities = [];
            }
        }
    }
    
    // If trails not provided, try to get them
    if (!trails) {
        trails = getTrailsForPark(park.park_id);
        
        // If still no trails, try to fetch from API
        if (trails.length === 0) {
            try {
                const response = await fetch(`${API_BASE}/trails?park_id=${encodeURIComponent(park.park_id)}&limit=1000`);
                if (response.ok) {
                    const fetchedTrails = await response.json();
                    trails = fetchedTrails || [];
                    console.log(`Fetched ${trails.length} trails for park ${park.park_id} from API`);
                }
            } catch (error) {
                console.error('Error fetching trails:', error);
                trails = [];
            }
        }
    }

    let html = `
        <div class="park-info-item">
            <h3>${park.park_name || 'Unknown Park'}</h3>
            <p><strong>ID:</strong> ${park.park_id}</p>
            <p><strong>Borough:</strong> ${park.borough || 'N/A'}</p>
            <p><strong>Zip Code:</strong> ${park.zipcode || 'N/A'}</p>
            <p><strong>Type:</strong> ${park.park_type || 'N/A'}</p>
            <p><strong>Acres:</strong> ${park.acres ? parseFloat(park.acres).toFixed(2) + ' acres' : 'N/A'}</p>
            <p><strong>Waterfront:</strong> ${park.is_waterfront ? 'Yes' : 'No'}</p>
            <p><strong>Rating:</strong> ${park.avg_rating ? parseFloat(park.avg_rating).toFixed(2) + '/5.0' : 'No rating yet'}</p>
            <p><strong>Latitude:</strong> ${park.latitude}</p>
            <p><strong>Longitude:</strong> ${park.longitude}</p>
    `;

    if (facilities.length > 0) {
        html += '<div class="facilities-section" style="margin-top: 20px; padding-top: 15px; border-top: 2px solid var(--border-color);">';
        html += '<h4 style="margin-bottom: 15px; color: var(--primary-color); font-size: 1.1em;">Facilities (' + facilities.length + ')</h4>';
        
        // Group facilities by type
        const facilitiesByType = {};
        facilities.forEach(f => {
            if (!facilitiesByType[f.facility_type]) {
                facilitiesByType[f.facility_type] = [];
            }
            facilitiesByType[f.facility_type].push(f);
        });
        
        Object.keys(facilitiesByType).sort().forEach(type => {
            const typeFacilities = facilitiesByType[type];
            html += '<div class="facility-group" style="margin-bottom: 20px; padding: 12px; background: var(--bg-color); border-radius: 8px; border-left: 4px solid var(--secondary-color);">';
            html += `<div class="facility-type-header" style="font-weight: 600; color: var(--primary-color); margin-bottom: 10px; font-size: 1em;">${type} (${typeFacilities.length})</div>`;
            
            typeFacilities.forEach((facility, index) => {
                html += '<div class="facility-detail" style="margin-left: 10px; margin-bottom: 10px; padding: 8px; background: white; border-radius: 6px; font-size: 0.9em;">';
                
                if (facility.dimensions) {
                    html += `<div style="margin-bottom: 5px;"><strong>Dimensions:</strong> ${facility.dimensions}</div>`;
                }
                
                if (facility.surface_type) {
                    html += `<div style="margin-bottom: 5px;"><strong>Surface:</strong> ${facility.surface_type}</div>`;
                }
                
                html += '<div style="display: flex; gap: 15px; margin-bottom: 5px; flex-wrap: wrap;">';
                if (facility.is_lighted) {
                    html += '<span style="color: var(--success-color); font-weight: 500;">💡 Lighted</span>';
                }
                if (facility.is_accessible) {
                    html += '<span style="color: var(--success-color); font-weight: 500;">♿ Accessible</span>';
                }
                html += '</div>';
                
                if (facility.field_condition) {
                    html += `<div style="margin-bottom: 5px; color: var(--text-secondary);"><strong>Condition:</strong> ${facility.field_condition}</div>`;
                }
                
                if (facility.avg_facility_rating && parseFloat(facility.avg_facility_rating) > 0) {
                    html += `<div style="margin-top: 5px; color: var(--warning-color);"><strong>Rating:</strong> ${parseFloat(facility.avg_facility_rating).toFixed(2)}/5.0`;
                    if (facility.total_facility_reviews > 0) {
                        html += ` (${facility.total_facility_reviews} review${facility.total_facility_reviews > 1 ? 's' : ''})`;
                    }
                    html += '</div>';
                }
                
                html += '</div>';
            });
            
            html += '</div>';
        });
        
        html += '</div>';
    } else {
        html += '<div class="no-facilities" style="margin-top: 15px; padding: 10px; background: var(--bg-color); border-radius: 8px; color: var(--text-secondary); font-style: italic;">No facilities available</div>';
    }

    // Add Trails Section
    if (trails && trails.length > 0) {
        html += '<div class="trails-section" style="margin-top: 20px; padding-top: 15px; border-top: 2px solid var(--border-color);">';
        html += '<h4 style="margin-bottom: 15px; color: #27ae60; font-size: 1.1em;">🛤️ Trails (' + trails.length + ')</h4>';
        
        trails.forEach((trail, index) => {
            html += '<div class="trail-detail" style="margin-bottom: 15px; padding: 12px; background: #f0f9f4; border-radius: 8px; border-left: 4px solid #27ae60;">';
            
            if (trail.trail_name) {
                html += `<div style="font-weight: 600; color: var(--primary-color); margin-bottom: 8px; font-size: 1em;">${trail.trail_name}</div>`;
            } else {
                html += `<div style="font-weight: 600; color: var(--primary-color); margin-bottom: 8px; font-size: 1em;">Trail ${index + 1}</div>`;
            }
            
            html += '<div style="display: flex; flex-direction: column; gap: 5px; font-size: 0.9em;">';
            
            if (trail.difficulty) {
                html += `<div><strong>Difficulty:</strong> ${trail.difficulty}</div>`;
            }
            
            if (trail.surface) {
                html += `<div><strong>Surface:</strong> ${trail.surface}</div>`;
            }
            
            if (trail.width_ft) {
                html += `<div><strong>Width:</strong> ${trail.width_ft} ft</div>`;
            }
            
            if (trail.has_trail_markers) {
                html += '<div style="color: var(--success-color); font-weight: 500;">📍 Has Trail Markers</div>';
            }
            
            if (trail.avg_trail_rating && parseFloat(trail.avg_trail_rating) > 0) {
                html += `<div style="margin-top: 5px; color: var(--warning-color);"><strong>Rating:</strong> ${parseFloat(trail.avg_trail_rating).toFixed(2)}/5.0`;
                if (trail.total_trail_reviews > 0) {
                    html += ` (${trail.total_trail_reviews} review${trail.total_trail_reviews > 1 ? 's' : ''})`;
                }
                html += '</div>';
            }
            
            html += '</div>';
            html += '</div>';
        });
        
        html += '</div>';
    }

    html += '</div>';
    parkInfo.innerHTML = html;
    infoPanel.style.display = 'block';

    // Scroll to info panel
    infoPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Center map on park
    if (park.latitude && park.longitude) {
        map.setView([parseFloat(park.latitude), parseFloat(park.longitude)], 14, {
            animate: true,
            duration: 0.5
        });
    }
}

// Apply Filters
function applyFilters() {
    updateVisibleParks();
}

// Clear Markers
function clearMarkers() {
    parkMarkers.forEach(({ marker }) => {
        map.removeLayer(marker);
    });
    parkMarkers = [];
}

// Load Statistics
async function loadStatistics() {
    try {
        const statsResponse = await fetch(`${API_BASE}/parks/stats`);
        if (!statsResponse.ok) throw new Error('Failed to load statistics');
        const stats = await statsResponse.json();
        
        document.getElementById('totalParks').textContent = stats.total_parks || '-';
        document.getElementById('totalFacilities').textContent = allFacilities.length || '-';
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Update Stats
function updateStats(displayedCount) {
    if (displayedCount !== undefined) {
        document.getElementById('displayedParks').textContent = displayedCount;
    } else {
        const bounds = map ? map.getBounds() : null;
        if (bounds && allParks.length > 0) {
            const visibleCount = allParks.filter(p => {
                if (!p.latitude || !p.longitude) return false;
                return bounds.contains([parseFloat(p.latitude), parseFloat(p.longitude)]);
            }).length;
            document.getElementById('displayedParks').textContent = visibleCount;
        } else {
            document.getElementById('displayedParks').textContent = allParks.length;
        }
    }
}

// Search Function with Autocomplete
function setupSearch() {
    const searchInput = document.getElementById('parkSearch');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');
    let searchTimeout;

    // Search on input (with debounce)
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
            // Also update filters to show search results on map
            currentFilters.searchTerm = query;
            applyFilters();
        }, 300);
    });

    // Search on button click
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

    // Search on Enter key
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

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('show');
        }
    });
}

// Perform search and show results
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
    ).slice(0, 10); // Limit to 10 results

    const searchResults = document.getElementById('searchResults');
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No parks found</div>';
        searchResults.classList.add('show');
        return;
    }

    // If selectFirst is true and we have results, select the first one
    if (selectFirst && results.length > 0) {
        selectParkFromSearch(results[0]);
        return;
    }

    // Display results
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

    // Add click handlers
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

// Select park from search results
async function selectParkFromSearch(park) {
    const searchInput = document.getElementById('parkSearch');
    const searchResults = document.getElementById('searchResults');
    
    // Update search input
    searchInput.value = park.park_name || park.park_id;
    // Don't filter by search term, show all parks but highlight this one
    currentFilters.searchTerm = '';
    
    // Hide search results
    searchResults.classList.remove('show');
    
    // Get facilities for this park (with normalized lookup)
    // showParkInfo will fetch from API if not in mapping
    await showParkInfo(park);
    
    // Apply filters (without search term)
    applyFilters();
    
    // Find and highlight the marker
    const markerData = parkMarkers.find(({ park: p }) => p.park_id === park.park_id);
    if (markerData) {
        markerData.marker.openPopup();
        // Highlight marker
        const parkFacilities = getFacilitiesForPark(park.park_id);
        markerData.marker.setIcon(createCustomIcon(true, parkFacilities.length, true));
        setTimeout(() => {
            markerData.marker.setIcon(createCustomIcon(parkFacilities.length > 0, parkFacilities.length));
        }, 2000);
    }
}

// Clear Filters
function clearFilters() {
    currentFilters = {
        facilityType: 'all',
        borough: 'all',
        searchTerm: ''
    };

    // Reset UI
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.type === 'all' || btn.dataset.borough === 'all') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    document.getElementById('parkSearch').value = '';
    document.getElementById('searchResults').classList.remove('show');
    applyFilters();
}

// Reset View
function resetView() {
    const nycCenter = [40.7128, -73.9352];
    map.setView(nycCenter, 11, {
        animate: true,
        duration: 0.8
    });
    updateVisibleParks();
}

// Show/Hide Loading
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

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
            const response = await fetch(`${API_BASE}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateUserUI();
                loginModal.classList.remove('show');
                loginForm.reset();
                errorDiv.classList.remove('show');
            } else {
                errorDiv.textContent = data.error || 'Login failed';
                errorDiv.classList.add('show');
            }
        } catch (error) {
            errorDiv.textContent = 'Failed to connect to server';
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
            const response = await fetch(`${API_BASE}/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Auto login after registration
                const loginResponse = await fetch(`${API_BASE}/users/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const loginData = await loginResponse.json();
                if (loginResponse.ok) {
                    currentUser = loginData.user;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    updateUserUI();
                    registerModal.classList.remove('show');
                    registerForm.reset();
                    errorDiv.classList.remove('show');
                }
            } else {
                errorDiv.textContent = data.error || 'Registration failed';
                errorDiv.classList.add('show');
            }
        } catch (error) {
            errorDiv.textContent = 'Failed to connect to server';
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

// Setup User Settings
function setupUserSettings() {
    const settingsModal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsForm = document.getElementById('settingsForm');
    const settingsClose = settingsModal.querySelector('.close');

    settingsBtn.addEventListener('click', async () => {
        if (!currentUser) return;
        // Display user info
        document.getElementById('settingsUsername').textContent = currentUser.username || 'N/A';
        document.getElementById('settingsEmail').textContent = currentUser.email || 'N/A';
        await loadUserPreferences();
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

        const preferences = {
            favoriteFacilities,
            showOnlyFavorites
        };

        const errorDiv = document.getElementById('settingsError');
        const successDiv = document.getElementById('settingsSuccess');

        try {
            const response = await fetch(`${API_BASE}/users/${currentUser.username}/preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ preferences })
            });

            const data = await response.json();

            if (response.ok) {
                errorDiv.classList.remove('show');
                successDiv.textContent = 'Settings saved successfully!';
                successDiv.classList.add('show');
                
                // Save to localStorage
                if (currentUser) {
                    currentUser.preferences = preferences;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                }

                // Update UI to show apply preferences button
                updateUserUI();

                // Apply preferences
                applyUserPreferences();

                setTimeout(() => {
                    settingsModal.classList.remove('show');
                    successDiv.classList.remove('show');
                }, 1500);
            } else {
                successDiv.classList.remove('show');
                errorDiv.textContent = data.error || 'Failed to save settings';
                errorDiv.classList.add('show');
            }
        } catch (error) {
            successDiv.classList.remove('show');
            errorDiv.textContent = 'Failed to connect to server';
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
            const response = await fetch(`${API_BASE}/users/${currentUser.username}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Logout user
                currentUser = null;
                localStorage.removeItem('currentUser');
                updateUserUI();
                
                // Close settings modal
                settingsModal.classList.remove('show');
                
                alert('Account deleted successfully.');
            } else {
                const data = await response.json();
                const errorDiv = document.getElementById('settingsError');
                errorDiv.textContent = data.error || 'Failed to delete account';
                errorDiv.classList.add('show');
            }
        } catch (error) {
            const errorDiv = document.getElementById('settingsError');
            errorDiv.textContent = 'Failed to connect to server';
            errorDiv.classList.add('show');
        }
    });

    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('show');
        }
    });
}

// Load User Preferences
async function loadUserPreferences() {
    if (!currentUser) return;

    try {
        // Try to get from localStorage first
        let preferences = currentUser.preferences || null;

        // Or fetch from server
        if (!preferences) {
            const response = await fetch(`${API_BASE}/users/${currentUser.username}/preferences`);
            if (response.ok) {
                const data = await response.json();
                preferences = data.preferences;
            }
        }

        // Populate settings form
        if (preferences) {
            // Favorite Facilities
            const facilityCheckboxes = document.querySelectorAll('#favoriteFacilities input[type="checkbox"]');
            facilityCheckboxes.forEach(cb => {
                cb.checked = preferences.favoriteFacilities?.includes(cb.value) || false;
                updateCheckboxStyle(cb);
            });

            // Display Preferences
            document.getElementById('showOnlyFavorites').checked = preferences.showOnlyFavorites || false;
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
    }
}

// Update Checkbox Style
function updateCheckboxStyle(checkbox) {
    const container = checkbox.closest('.settings-checkbox');
    if (checkbox.checked) {
        container.classList.add('checked');
    } else {
        container.classList.remove('checked');
    }
}

// Initialize Settings Form
async function initializeSettingsForm() {
    // Wait for facilities to load
    if (allFacilities.length === 0 || !map) {
        setTimeout(initializeSettingsForm, 500);
        return;
    }

    const favoriteFacilities = document.getElementById('favoriteFacilities');

    // Get unique facility types
    const facilityTypes = [...new Set(allFacilities.map(f => f.facility_type))].sort();

    // Populate Facility Checkboxes
    favoriteFacilities.innerHTML = facilityTypes.map(type => `
        <div class="settings-checkbox">
            <input type="checkbox" id="facility-${type}" value="${type}" 
                   onchange="updateCheckboxStyle(this)">
            <label for="facility-${type}">${type}</label>
        </div>
    `).join('');
}

// Apply User Preferences
function applyUserPreferences(forceApply = false) {
    if (!currentUser || !currentUser.preferences) {
        // If no preferences, try to load them
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

    // Apply favorite facilities filter
    if (prefs.favoriteFacilities && prefs.favoriteFacilities.length > 0) {
        // Only auto-apply on login if showOnlyFavorites is true, or force apply if button clicked
        if (prefs.showOnlyFavorites || forceApply) {
            // Find and activate the first favorite facility filter button
            const facilityButtons = document.querySelectorAll('#facilityFilters .filter-btn');
            let found = false;
            facilityButtons.forEach(btn => {
                if (!found && prefs.favoriteFacilities.includes(btn.dataset.type)) {
                    // Remove active from all buttons first
                    facilityButtons.forEach(b => b.classList.remove('active'));
                    // Add active to the matching button
                    btn.classList.add('active');
                    // Update filter
                    currentFilters.facilityType = btn.dataset.type;
                    // Apply filters
                    applyFilters();
                    found = true;
                }
            });
        }
    }
}

// Update User UI
function updateUserUI() {
    const userSection = document.getElementById('userSection');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const userInfo = document.getElementById('userInfo');
    const usernameDisplay = document.getElementById('usernameDisplay');

    const applyPreferencesBtn = document.getElementById('applyPreferencesBtn');
    
    if (currentUser) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        usernameDisplay.textContent = currentUser.username;
        
        // Show apply preferences button if user has preferences
        if (currentUser.preferences && currentUser.preferences.favoriteFacilities && currentUser.preferences.favoriteFacilities.length > 0) {
            applyPreferencesBtn.style.display = 'block';
        } else {
            applyPreferencesBtn.style.display = 'none';
        }
        
        // Load and apply user preferences
        if (currentUser.preferences) {
            applyUserPreferences();
        } else {
            // Try to load from server
            loadUserPreferences().then(() => {
                if (currentUser && currentUser.preferences) {
                    applyUserPreferences();
                    // Show button if preferences loaded
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
        // Reset filter buttons
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
        currentFilters.showTrails = 'all';
        applyFilters();
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

// Handle window resize
window.addEventListener('resize', () => {
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
});
