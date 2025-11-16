// Marker Management Functions
function createCustomIcon(hasFacilities, facilityCount = 0, highlighted = false, hasTrails = false) {
    let color, size, borderWidth;
    
    if (highlighted) {
        color = MARKER_COLORS.HIGHLIGHTED;
        size = 20;
        borderWidth = 3;
    } else if (hasFacilities && hasTrails) {
        color = MARKER_COLORS.FACILITIES_AND_TRAILS;
        size = facilityCount > 5 ? 18 : 16;
        borderWidth = 3;
    } else if (hasFacilities) {
        color = MARKER_COLORS.FACILITIES_ONLY;
        size = facilityCount > 5 ? 18 : 15;
        borderWidth = 3;
    } else if (hasTrails) {
        color = MARKER_COLORS.TRAILS_ONLY;
        size = 15;
        borderWidth = 3;
    } else {
        color = MARKER_COLORS.NONE;
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

function createSearchMarkerIcon() {
    return L.divIcon({
        className: 'search-marker',
        html: `<div style="
            width: 20px;
            height: 20px;
            background-color: #e74c3c;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
    });
}

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

function clearMarkers() {
    parkMarkers.forEach(({ marker }) => {
        map.removeLayer(marker);
    });
    parkMarkers = [];
}

function displayParksOnMap(parks) {
    clearMarkers();

    if (!parks || parks.length === 0) {
        console.log('No parks to display');
        updateStats(0);
        return;
    }

    parks.forEach(park => {
        if (!park.latitude || !park.longitude) return;

        const normalizedParkId = String(park.park_id || '').trim();
        if (!normalizedParkId) return;
        
        const facilities = getFacilitiesForPark(normalizedParkId);
        const trails = getTrailsForPark(normalizedParkId);

        const icon = createCustomIcon(facilities.length > 0, facilities.length, false, trails.length > 0);

        const marker = L.marker([parseFloat(park.latitude), parseFloat(park.longitude)], {
            icon: icon
        });

        const popupContent = createPopupContent(park, facilities, trails);

        marker.bindPopup(popupContent, {
            maxWidth: 300,
            className: 'custom-popup',
            closeOnClick: false,
            autoClose: false,
            closeOnEscapeKey: true
        });
        
        // Show popup on mouseover, hide on mouseout with delay
        // Ensure only one popup is open at a time
        let popupTimeout;
        marker.on('mouseover', function() {
            // Close any currently open popup immediately
            if (currentOpenPopup && currentOpenPopup !== marker && currentOpenPopup.isPopupOpen()) {
                currentOpenPopup.closePopup();
            }
            
            clearTimeout(popupTimeout);
            marker.openPopup();
            currentOpenPopup = marker;
        });
        
        marker.on('mouseout', function() {
            popupTimeout = setTimeout(() => {
                if (marker.isPopupOpen()) {
                    marker.closePopup();
                }
                if (currentOpenPopup === marker) {
                    currentOpenPopup = null;
                }
            }, 300); // Reduced delay for faster response
        });
        
        marker.on('popupopen', function() {
            currentOpenPopup = marker;
            const popupElement = marker.getPopup().getElement();
            if (popupElement) {
                popupElement.addEventListener('mouseenter', () => {
                    clearTimeout(popupTimeout);
                });
                popupElement.addEventListener('mouseleave', () => {
                    popupTimeout = setTimeout(() => {
                        if (marker.isPopupOpen()) {
                            marker.closePopup();
                        }
                        if (currentOpenPopup === marker) {
                            currentOpenPopup = null;
                        }
                    }, 300);
                });
            }
        });
        
        marker.on('popupclose', function() {
            if (currentOpenPopup === marker) {
                currentOpenPopup = null;
            }
        });
        
        marker.on('click', async () => {
            const parkFacilities = getFacilitiesForPark(park.park_id);
            const parkTrails = getTrailsForPark(park.park_id);
            await showParkInfo(park, parkFacilities, parkTrails);
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

function addSearchMarker(park) {
    if (searchMarker) {
        map.removeLayer(searchMarker);
        searchMarker = null;
    }
    
    if (!park.latitude || !park.longitude) return;
    
    searchMarker = L.marker([parseFloat(park.latitude), parseFloat(park.longitude)], {
        icon: createSearchMarkerIcon(),
        zIndexOffset: 1000
    });
    
    const facilities = getFacilitiesForPark(park.park_id);
    const trails = getTrailsForPark(park.park_id);
    const popupContent = createPopupContent(park, facilities, trails);
    searchMarker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'custom-popup search-popup'
    });
    
    searchMarker.addTo(map);
    searchMarker.openPopup();
    
    map.setView([parseFloat(park.latitude), parseFloat(park.longitude)], SEARCH_ZOOM, {
        animate: true,
        duration: 0.8
    });
}

function removeSearchMarker() {
    if (searchMarker) {
        map.removeLayer(searchMarker);
        searchMarker = null;
    }
}

