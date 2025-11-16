// Global State Management
let map = null;
let parkMarkers = [];
let allParks = [];
let allFacilities = [];
let allTrails = [];
let currentUser = null;
let searchMarker = null;
let parkFacilityMap = {};
let parkTrailMap = {};
let currentOpenPopup = null; // Track currently open popup marker

let currentFilters = {
    facilityType: 'all',
    borough: 'all',
    searchTerm: '',
    showTrails: 'all'
};

