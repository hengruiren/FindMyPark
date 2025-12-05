// Recommendations Functions
let currentRecommendations = null;
let currentRecommendationType = 'rule-based'; // 'rule-based' or 'ai'

function setupRecommendations() {
    const loadRecommendationsBtn = document.getElementById('loadRecommendationsBtn');
    const loadAIRecommendationsBtn = document.getElementById('loadAIRecommendationsBtn');
    const aiPromptInput = document.getElementById('aiPromptInput');
    
    // Load rule-based recommendations button
    if (loadRecommendationsBtn) {
        loadRecommendationsBtn.addEventListener('click', async () => {
            if (!currentUser) {
                alert('Please login to get personalized recommendations');
                return;
            }
            await loadRecommendations(currentUser.username);
        });
    }
    
    // Load AI recommendations button
    if (loadAIRecommendationsBtn) {
        loadAIRecommendationsBtn.addEventListener('click', async () => {
            if (!currentUser) {
                alert('Please login to get AI recommendations');
                return;
            }
            const prompt = aiPromptInput ? aiPromptInput.value : '';
            await loadAIRecommendations(currentUser.username, prompt);
        });
    }
}

async function loadRecommendations(username) {
    const loadBtn = document.getElementById('loadRecommendationsBtn');
    const top3Container = document.getElementById('recommendationsTop3');
    const top10Container = document.getElementById('recommendationsTop10');
    
    if (loadBtn) loadBtn.textContent = 'Loading...';
    
    try {
        const data = await fetchRecommendations(username, 10);
        currentRecommendations = data;
        currentRecommendationType = 'rule-based';
        
        // Display top 3 detailed recommendations
        displayTop3Recommendations(data.top3);
        
        // Display top 10 simple list
        displayTop10Recommendations(data.top10);
        
        // Show recommendation type badge
        showRecommendationTypeBadge('Rule-Based Algorithm');
        
        if (loadBtn) {
            loadBtn.textContent = 'Refresh Recommendations';
            loadBtn.style.display = 'none'; // Hide after loading
        }
    } catch (error) {
        console.error('Error loading recommendations:', error);
        alert('Failed to load recommendations: ' + error.message);
        if (loadBtn) loadBtn.textContent = 'Get Recommendations';
    }
}

async function loadAIRecommendations(username, prompt = '') {
    const loadBtn = document.getElementById('loadAIRecommendationsBtn');
    const top3Container = document.getElementById('recommendationsTop3');
    const top10Container = document.getElementById('recommendationsTop10');
    
    const originalText = loadBtn ? loadBtn.textContent : '';
        if (loadBtn) loadBtn.textContent = 'AI Processing...';
    
    try {
        const data = await fetchAIRecommendations(username, prompt, 5);
        currentRecommendations = data;
        currentRecommendationType = 'ai';
        
        // Display AI recommendations
        displayAIRecommendations(data.recommendations, data.aiExplanation);
        
        // Clear top 10 list for AI (we only show top recommendations)
        if (top10Container) top10Container.innerHTML = '';
        
        // Show recommendation type badge
        showRecommendationTypeBadge('AI-Powered (GPT)', data.aiExplanation);
        
        if (loadBtn) {
            loadBtn.textContent = 'Get AI Recommendations';
        }
    } catch (error) {
        console.error('Error loading AI recommendations:', error);
        
        // Check if it's a configuration error
        if (error.message.includes('API key not configured')) {
            alert('⚠️ OpenAI API is not configured.\n\nPlease set up OPENAI_API_KEY in your .env file.\n\nSee setup instructions for details.');
        } else {
            alert('Failed to load AI recommendations: ' + error.message + '\n\nTry using the standard recommendations instead.');
        }
        
        if (loadBtn) loadBtn.textContent = originalText || 'Get AI Recommendations';
    }
}

function showRecommendationTypeBadge(type, explanation = '') {
    const top3Container = document.getElementById('recommendationsTop3');
    if (!top3Container) return;
    
    // Remove existing badge if any
    const existingBadge = document.querySelector('.recommendation-type-badge');
    if (existingBadge) existingBadge.remove();
    
    const badge = document.createElement('div');
    badge.className = 'recommendation-type-badge';
    badge.innerHTML = `
        <div class="badge-content">
            <span class="badge-text">${type}</span>
        </div>
        ${explanation ? `<div class="badge-explanation">${explanation}</div>` : ''}
    `;
    
    top3Container.insertBefore(badge, top3Container.firstChild);
}

function displayAIRecommendations(recommendations, explanation) {
    const container = document.getElementById('recommendationsTop3');
    if (!container) return;
    
    if (!recommendations || recommendations.length === 0) {
        container.innerHTML = `
            <div class="no-recommendations">
                <p>❌ No AI recommendations available.</p>
                <p>This could be because:</p>
                <ul>
                    <li>OpenAI API is not configured</li>
                    <li>No parks match your criteria</li>
                    <li>API quota exceeded</li>
                </ul>
                <p>Try using the standard recommendations instead.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recommendations.map((park, index) => {
        const facilities = (park.Facilities || []);
        const facilityTypes = [...new Set(facilities.map(f => f.facility_type))];
        const trails = (park.Trails || []).length || 0;
        const rating = parseFloat(park.avg_rating) || 0;
        const reviews = (park.Reviews || []);
        const score = park.aiMatchScore || 0;
        const scorePercent = Math.round(score);
        
        // Score color based on value
        let scoreColor = '#e74c3c'; // Red for low scores
        if (scorePercent >= 80) scoreColor = '#27ae60'; // Green for high scores
        else if (scorePercent >= 60) scoreColor = '#f39c12'; // Orange for medium scores
        
        return `
            <div class="recommendation-card ai-recommendation-card" data-park-id="${park.park_id}">
                <div class="recommendation-header">
                    <div class="recommendation-header-left">
                        <span class="recommendation-rank">#${index + 1}</span>
                        <h3 class="recommendation-title">${park.park_name}</h3>
                    </div>
                    <div class="recommendation-score-simple">
                        <span class="score-value">${scorePercent}</span>
                        <span class="score-label">Score</span>
                    </div>
                </div>
                <div class="ai-reason-box">
                    <strong>Recommendation:</strong> ${park.aiReason || 'Recommended for you'}
                </div>
                <div class="recommendation-body">
                    <div class="recommendation-stats-grid">
                        <div class="stat-item">
                            <span class="stat-icon">📍</span>
                            <div class="stat-content">
                                <div class="stat-label">Borough</div>
                                <div class="stat-value">${park.borough || 'N/A'}</div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">🏞️</span>
                            <div class="stat-content">
                                <div class="stat-label">Type</div>
                                <div class="stat-value">${park.park_type || 'N/A'}</div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">⭐</span>
                            <div class="stat-content">
                                <div class="stat-label">Rating</div>
                                <div class="stat-value">${rating > 0 ? rating.toFixed(1) + '/5.0' : 'No rating'}</div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">📏</span>
                            <div class="stat-content">
                                <div class="stat-label">Size</div>
                                <div class="stat-value">${park.acres ? parseFloat(park.acres).toFixed(1) + ' ac' : 'N/A'}</div>
                            </div>
                        </div>
                        ${park.is_waterfront ? `
                        <div class="stat-item">
                            <span class="stat-icon">🌊</span>
                            <div class="stat-content">
                                <div class="stat-label">Waterfront</div>
                                <div class="stat-value">Yes</div>
                            </div>
                        </div>
                        ` : ''}
                        <div class="stat-item">
                            <span class="stat-icon">🛤️</span>
                            <div class="stat-content">
                                <div class="stat-label">Trails</div>
                                <div class="stat-value">${trails}</div>
                            </div>
                        </div>
                    </div>
                    ${facilityTypes.length > 0 ? `
                    <div class="recommendation-facilities">
                        <div class="facilities-header">
                            <strong>🏃 Facilities (${facilities.length})</strong>
                        </div>
                        <div class="facility-tags">
                            ${facilityTypes.slice(0, 8).map(type => `
                                <span class="facility-tag">${type}</span>
                            `).join('')}
                            ${facilityTypes.length > 8 ? `<span class="facility-tag more">+${facilityTypes.length - 8}</span>` : ''}
                        </div>
                    </div>
                    ` : ''}
                    ${reviews.length > 0 ? `
                        <div class="recommendation-reviews">
                            <div class="reviews-header">
                                <strong>💬 Recent Reviews (${reviews.length})</strong>
                            </div>
                            <div class="reviews-list">
                                ${reviews.slice(0, 2).map(review => `
                                    <div class="review-item">
                                        <div class="review-header">
                                            <strong>${review.User?.username || 'Anonymous'}</strong>
                                            <span class="review-rating">⭐ ${review.rating}/5</span>
                                        </div>
                                        <div class="review-comment">${review.comment || 'No comment'}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : '<div class="no-reviews">No reviews yet. Be the first to review!</div>'}
                </div>
                <button class="view-on-map-btn" onclick="viewParkOnMap('${park.park_id}')">
                    View on Map
                </button>
            </div>
        `;
    }).join('');
}

function displayTop3Recommendations(top3) {
    const container = document.getElementById('recommendationsTop3');
    if (!container) return;
    
    if (!top3 || top3.length === 0) {
        container.innerHTML = '<p>No recommendations available. Please update your preferences in Settings.</p>';
        return;
    }
    
    container.innerHTML = top3.map((park, index) => {
        const facilities = (park.Facilities || []);
        const facilityTypes = [...new Set(facilities.map(f => f.facility_type))];
        const facilityDisplay = facilityTypes.length > 0 ? facilityTypes.slice(0, 5).join(', ') + (facilityTypes.length > 5 ? ` +${facilityTypes.length - 5} more` : '') : 'None';
        const trails = (park.Trails || []).length || 0;
        const rating = parseFloat(park.avg_rating) || 0;
        const reviews = (park.Reviews || []);
        const score = park.recommendationScore.toFixed(1);
        const scorePercent = Math.round(park.recommendationScore);
        
        // Score color based on value
        let scoreColor = '#e74c3c'; // Red for low scores
        if (scorePercent >= 80) scoreColor = '#27ae60'; // Green for high scores
        else if (scorePercent >= 60) scoreColor = '#f39c12'; // Orange for medium scores
        
        return `
            <div class="recommendation-card" data-park-id="${park.park_id}">
                <div class="recommendation-header">
                    <div class="recommendation-header-left">
                        <span class="recommendation-rank">#${index + 1}</span>
                        <h3 class="recommendation-title">${park.park_name}</h3>
                    </div>
                    <div class="recommendation-score-simple">
                        <span class="score-value">${scorePercent}</span>
                        <span class="score-label">Score</span>
                    </div>
                </div>
                <div class="recommendation-body">
                    <div class="recommendation-stats-grid">
                        <div class="stat-item">
                            <span class="stat-icon">📍</span>
                            <div class="stat-content">
                                <div class="stat-label">Borough</div>
                                <div class="stat-value">${park.borough || 'N/A'}</div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">🏞️</span>
                            <div class="stat-content">
                                <div class="stat-label">Type</div>
                                <div class="stat-value">${park.park_type || 'N/A'}</div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">⭐</span>
                            <div class="stat-content">
                                <div class="stat-label">Rating</div>
                                <div class="stat-value">${rating > 0 ? rating.toFixed(1) + '/5.0' : 'No rating'}</div>
                            </div>
                        </div>
                        <div class="stat-item">
                            <span class="stat-icon">📏</span>
                            <div class="stat-content">
                                <div class="stat-label">Size</div>
                                <div class="stat-value">${park.acres ? parseFloat(park.acres).toFixed(1) + ' ac' : 'N/A'}</div>
                            </div>
                        </div>
                        ${park.is_waterfront ? `
                        <div class="stat-item">
                            <span class="stat-icon">🌊</span>
                            <div class="stat-content">
                                <div class="stat-label">Waterfront</div>
                                <div class="stat-value">Yes</div>
                            </div>
                        </div>
                        ` : ''}
                        <div class="stat-item">
                            <span class="stat-icon">🛤️</span>
                            <div class="stat-content">
                                <div class="stat-label">Trails</div>
                                <div class="stat-value">${trails}</div>
                            </div>
                        </div>
                    </div>
                    ${facilityTypes.length > 0 ? `
                    <div class="recommendation-facilities">
                        <div class="facilities-header">
                            <strong>🏃 Facilities (${facilities.length})</strong>
                        </div>
                        <div class="facility-tags">
                            ${facilityTypes.slice(0, 8).map(type => `
                                <span class="facility-tag">${type}</span>
                            `).join('')}
                            ${facilityTypes.length > 8 ? `<span class="facility-tag more">+${facilityTypes.length - 8}</span>` : ''}
                        </div>
                    </div>
                    ` : ''}
                    ${reviews.length > 0 ? `
                        <div class="recommendation-reviews">
                            <div class="reviews-header">
                                <strong>💬 Recent Reviews (${reviews.length})</strong>
                            </div>
                            <div class="reviews-list">
                                ${reviews.slice(0, 2).map(review => `
                                    <div class="review-item">
                                        <div class="review-header">
                                            <strong>${review.User?.username || 'Anonymous'}</strong>
                                            <span class="review-rating">⭐ ${review.rating}/5</span>
                                        </div>
                                        <div class="review-comment">${review.comment || 'No comment'}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : '<div class="no-reviews">No reviews yet. Be the first to review!</div>'}
                </div>
                <button class="view-on-map-btn" onclick="viewParkOnMap('${park.park_id}')">
                    View on Map
                </button>
            </div>
        `;
    }).join('');
}

function displayTop10Recommendations(top10) {
    const container = document.getElementById('recommendationsTop10');
    if (!container) return;
    
    if (!top10 || top10.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    const list = document.createElement('div');
    list.className = 'recommendations-list';
    list.innerHTML = `
        <div class="top10-header">
            <h3>Top 10 Recommended Parks</h3>
        </div>
        <div class="recommendations-simple-list">
            ${top10.map((park, index) => {
                const rating = parseFloat(park.avg_rating) || 0;
                const score = Math.round(park.recommendationScore);
                let rankClass = '';
                if (index === 0) rankClass = 'rank-gold';
                else if (index === 1) rankClass = 'rank-silver';
                else if (index === 2) rankClass = 'rank-bronze';
                
                let scoreColor = '#e74c3c';
                if (score >= 80) scoreColor = '#27ae60';
                else if (score >= 60) scoreColor = '#f39c12';
                
                return `
                    <div class="recommendation-item ${rankClass}" data-park-id="${park.park_id}">
                        <div class="item-rank">
                            <span class="rank-number">${index + 1}</span>
                            ${index < 3 ? `<span class="rank-medal">${index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>` : ''}
                        </div>
                        <div class="item-content">
                            <div class="item-name">${park.park_name}</div>
                            <div class="item-meta">
                                <span class="item-borough">📍 ${park.borough || 'N/A'}</span>
                                ${rating > 0 ? `<span class="item-rating">⭐ ${rating.toFixed(1)}</span>` : '<span class="item-rating no-rating">No rating</span>'}
                            </div>
                        </div>
                        <div class="item-score" style="--score-color: ${scoreColor}">
                            ${score}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    container.innerHTML = '';
    container.appendChild(list);
    
    // Add click handlers
    container.querySelectorAll('.recommendation-item').forEach(item => {
        item.addEventListener('click', () => {
            const parkId = item.dataset.parkId;
            viewParkOnMap(parkId);
        });
    });
}

async function viewParkOnMap(parkId) {
    // Close recommendations modal
    const recommendationsModal = document.getElementById('recommendationsModal');
    if (recommendationsModal) {
        recommendationsModal.classList.remove('show');
    }
    
    const park = allParks.find(p => p.park_id === parkId);
    if (!park || !map) {
        console.error('Park not found or map not initialized:', parkId);
        return;
    }
    
    console.log('Viewing park on map:', park.park_name, parkId);
    
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
            // Use addSearchMarker to create red highlighted marker (same as search)
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

// Show recommendations button when user logs in
function updateRecommendationsUI() {
    // Floating button is managed by floatingButtons.js
    if (!currentUser) {
        currentRecommendations = null;
    }
}

window.reloadPersonalizedRecommendations = async function() {
    if (currentUser) {
        console.log('Settings saved, reloading recommendations...');
        const loadBtn = document.getElementById('loadRecommendationsBtn');
        if (loadBtn) loadBtn.textContent = 'Updating...';
        
        // 清空当前数据以强制 UI 更新
        currentRecommendations = null;
        await loadRecommendations(currentUser.username);
    }
};