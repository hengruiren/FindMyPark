// API Functions
async function fetchParks(limit = 10000) {
    const response = await fetch(`${API_BASE}/parks?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to load parks');
    return await response.json();
}

async function fetchFacilities(limit = 10000) {
    const response = await fetch(`${API_BASE}/facilities?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to load facilities');
    return await response.json();
}

async function fetchTrails(limit = 10000) {
    const response = await fetch(`${API_BASE}/trails?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to load trails');
    return await response.json();
}

async function fetchFacilityTypes() {
    const response = await fetch(`${API_BASE}/facilities/types`);
    if (!response.ok) throw new Error('Failed to load facility types');
    return await response.json();
}

async function fetchBoroughs() {
    const response = await fetch(`${API_BASE}/parks/boroughs`);
    if (!response.ok) throw new Error('Failed to load boroughs');
    return await response.json();
}

async function fetchParkStats() {
    const response = await fetch(`${API_BASE}/parks/stats`);
    if (!response.ok) throw new Error('Failed to load statistics');
    return await response.json();
}

async function fetchFacilitiesByPark(parkId) {
    const response = await fetch(`${API_BASE}/facilities?park_id=${encodeURIComponent(parkId)}&limit=1000`);
    if (!response.ok) return [];
    return await response.json();
}

async function fetchTrailsByPark(parkId) {
    const response = await fetch(`${API_BASE}/trails?park_id=${encodeURIComponent(parkId)}&limit=1000`);
    if (!response.ok) return [];
    return await response.json();
}

// User API Functions
async function loginUser(username, password) {
    const response = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');
    return data;
}

async function registerUser(username, email, password) {
    const response = await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Registration failed');
    return data;
}

async function fetchUserPreferences(username) {
    const response = await fetch(`${API_BASE}/users/${username}/preferences`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.preferences;
}

async function updateUserPreferences(username, preferences) {
    const response = await fetch(`${API_BASE}/users/${username}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to save preferences');
    return data;
}

async function deleteUser(username) {
    const response = await fetch(`${API_BASE}/users/${username}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
    }
    return true;
}

// Review API Functions
async function fetchParkReviews(parkId, limit = 50) {
    const response = await fetch(`${API_BASE}/reviews/park/${parkId}?limit=${limit}`);
    if (!response.ok) return [];
    return await response.json();
}

async function createParkReview(userId, parkId, rating, comment) {
    const response = await fetch(`${API_BASE}/reviews/createReview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, park_id: parkId, rating, comment })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create review');
    return data;
}

async function updateReview(reviewId, rating, comment) {
    const response = await fetch(`${API_BASE}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update review');
    return data;
}

async function deleteReview(reviewId) {
    const response = await fetch(`${API_BASE}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete review');
    }
    return true;
}

