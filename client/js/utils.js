// Utility Functions
function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

async function loadStatistics() {
    try {
        const stats = await fetchParkStats();
        document.getElementById('totalParks').textContent = stats.total_parks || '-';
        document.getElementById('totalFacilities').textContent = allFacilities.length || '-';
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

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

async function showParkInfo(park, facilities = null, trails = null) {
    const infoPanel = document.getElementById('infoPanel');
    const parkInfo = document.getElementById('parkInfo');
    
    if (!facilities || facilities.length === 0) {
        facilities = getFacilitiesForPark(park.park_id);
        
        if (facilities.length === 0) {
            try {
                facilities = await fetchFacilitiesByPark(park.park_id);
                console.log(`Fetched ${facilities.length} facilities for park ${park.park_id} from API`);
            } catch (error) {
                console.error('Error fetching facilities:', error);
                facilities = [];
            }
        }
    }
    
    if (!trails) {
        trails = getTrailsForPark(park.park_id);
        
        if (trails.length === 0) {
            try {
                trails = await fetchTrailsByPark(park.park_id);
                console.log(`Fetched ${trails.length} trails for park ${park.park_id} from API`);
            } catch (error) {
                console.error('Error fetching trails:', error);
                trails = [];
            }
        }
    }

    // Check if park is favorite (with fallback if function not available yet)
    const isParkFavorite = currentUser && typeof isFavorite === 'function' ? isFavorite(park.park_id) : false;
    const favoriteBtnClass = isParkFavorite ? 'favorite-btn active' : 'favorite-btn';
    const favoriteBtnText = isParkFavorite ? `
        <svg class="tag-icon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
        <span>Saved</span>
    ` : `
        <svg class="tag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
        <span>Save</span>
    `;
    
    let html = `
        <div class="park-info-item">
            <div class="park-header-with-favorite">
                <h3>${park.park_name || 'Unknown Park'}</h3>
                ${currentUser ? `
                    <button class="${favoriteBtnClass}" data-park-id="${park.park_id}" onclick="toggleFavorite('${park.park_id}')">
                        ${favoriteBtnText}
                    </button>
                ` : ''}
            </div>
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

    // Load and display reviews (after basic info, before facilities)
    const reviews = await loadParkReviews(park.park_id);
    const reviewsHtml = renderReviewsSection(reviews, park.park_id);
    html += reviewsHtml;

    if (facilities.length > 0) {
        html += '<div class="facilities-section" style="margin-top: 20px; padding-top: 15px; border-top: 2px solid var(--border-color);">';
        html += '<h4 style="margin-bottom: 15px; color: var(--primary-color); font-size: 1.1em;">Facilities (' + facilities.length + ')</h4>';
        
        const facilitiesByType = {};
        facilities.forEach(f => {
            if (!facilitiesByType[f.facility_type]) {
                facilitiesByType[f.facility_type] = [];
            }
            facilitiesByType[f.facility_type].push(f);
        });
        
        Object.keys(facilitiesByType).sort().forEach(type => {
            const typeFacilities = facilitiesByType[type];
            html += '<details class="facility-group" style="margin-bottom: 15px; padding: 12px; background: var(--bg-color); border-radius: 8px; border-left: 4px solid var(--secondary-color); cursor: pointer;">';
            html += `<summary class="facility-type-header" style="font-weight: 600; color: var(--primary-color); font-size: 1em; list-style: none; cursor: pointer; user-select: none; padding: 5px 0;">`;
            html += `<span style="display: inline-flex; align-items: center; gap: 8px;">`;
            html += `<span style="font-size: 0.9em;">▶</span>`;
            html += `<span>${type} (${typeFacilities.length})</span>`;
            html += `</span>`;
            html += `</summary>`;
            
            html += '<div style="margin-top: 10px; padding-left: 20px;">';
            typeFacilities.forEach((facility, index) => {
                html += '<div class="facility-detail" style="margin-bottom: 10px; padding: 8px; background: white; border-radius: 6px; font-size: 0.9em;">';
                
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
            html += '</details>';
        });
        
        html += '</div>';
    } else {
        html += '<div class="no-facilities" style="margin-top: 15px; padding: 10px; background: var(--bg-color); border-radius: 8px; color: var(--text-secondary); font-style: italic;">No facilities available</div>';
    }

    if (trails && trails.length > 0) {
        html += '<div class="trails-section" style="margin-top: 20px; padding-top: 15px; border-top: 2px solid var(--border-color);">';
        html += '<h4 style="margin-bottom: 15px; color: #27ae60; font-size: 1.1em;">🛤️ Trails (' + trails.length + ')</h4>';
        
        html += '<details class="trail-group" style="margin-bottom: 15px; padding: 12px; background: #f0f9f4; border-radius: 8px; border-left: 4px solid #27ae60; cursor: pointer;">';
        html += `<summary class="trail-header" style="font-weight: 600; color: var(--primary-color); font-size: 1em; list-style: none; cursor: pointer; user-select: none; padding: 5px 0;">`;
        html += `<span style="display: inline-flex; align-items: center; gap: 8px;">`;
        html += `<span style="font-size: 0.9em;">▶</span>`;
        html += `<span>All Trails (${trails.length})</span>`;
        html += `</span>`;
        html += `</summary>`;
        
        html += '<div style="margin-top: 10px; padding-left: 20px;">';
        trails.forEach((trail, index) => {
            html += '<div class="trail-detail" style="margin-bottom: 15px; padding: 12px; background: white; border-radius: 8px; font-size: 0.9em;">';
            
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
        html += '</details>';
        
        html += '</div>';
    }

    html += '</div>';
    parkInfo.innerHTML = html;
    infoPanel.style.display = 'block';
    
    // Update favorite button state after a short delay to ensure functions are loaded
    setTimeout(() => {
        if (typeof updateFavoriteButtons === 'function') {
            updateFavoriteButtons();
        }
    }, 50);
    
    // Setup review form after rendering
    setTimeout(() => {
        setupReviewForm(park.park_id);
    }, 100);

    infoPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (park.latitude && park.longitude && !searchMarker) {
        map.setView([parseFloat(park.latitude), parseFloat(park.longitude)], 14, {
            animate: true,
            duration: 0.5
        });
    }
}

