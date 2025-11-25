// Global variables
let map;
let markers = [];
let userMarker = null;
let filteredProjects = [...farmersMarkets];
let userLocation = null;
let nearMeActive = false;

// DOM elements
let searchInput;
let districtFilter;
let cityFilter;
let practiceFilter;
let productFilter;
let resetFiltersBtn;
let clearSearchBtn;
let listViewBtn;
let mapViewBtn;
let listView;
let mapView;
let projectsList;
let noResults;
let resultsCount;
let nearMeBtn;
let radiusFilter;
let radiusFilterGroup;

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeElements();
    updateHeaderStats();
    updateFAQStats();
    initializeFilters();
    initializeEventListeners();
    initializeMap();
    displayProjects(filteredProjects);
    updateResultsCount();
});

// Initialize DOM elements
function initializeElements() {
    searchInput = document.getElementById('searchInput');
    districtFilter = document.getElementById('districtFilter');
    cityFilter = document.getElementById('cityFilter');
    practiceFilter = document.getElementById('practiceFilter');
    productFilter = document.getElementById('productFilter');
    resetFiltersBtn = document.getElementById('resetFilters');
    clearSearchBtn = document.getElementById('clearSearch');
    listViewBtn = document.getElementById('listViewBtn');
    mapViewBtn = document.getElementById('mapViewBtn');
    listView = document.getElementById('listView');
    mapView = document.getElementById('mapView');
    nearMeBtn = document.getElementById('nearMeBtn');
    radiusFilter = document.getElementById('radiusFilter');
    radiusFilterGroup = document.getElementById('radiusFilterGroup');
    // Set current year
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    projectsList = document.getElementById('projectsList');
    noResults = document.getElementById('noResults');
    resultsCount = document.getElementById('resultsCount');
}

// Update header statistics dynamically
function updateHeaderStats() {
    // Calculate total projects
    const totalProjects = farmersMarkets.length;

    // Calculate unique cities
    const uniqueCities = new Set(farmersMarkets.map(project => project.City));
    const totalCities = uniqueCities.size;

    // Update DOM
    const totalProjectsEl = document.getElementById('totalProjects');
    const totalCitiesEl = document.getElementById('totalCities');

    if (totalProjectsEl) totalProjectsEl.textContent = totalProjects;
    if (totalCitiesEl) totalCitiesEl.textContent = totalCities;
}

// Update FAQ statistics dynamically
function updateFAQStats() {
    // Calculate total projects
    const totalProjects = farmersMarkets.length;

    // Update FAQ DOM elements
    const faqTotalProjectsEl = document.getElementById('faqTotalProjects');

    if (faqTotalProjectsEl) {
        faqTotalProjectsEl.textContent = `${totalProjects} markets`;
    }
}

// Initialize filters with unique values from data
function initializeFilters() {
    // Populate district filter
    const districts = [...new Set(farmersMarkets.map(project => project.District).filter(d => d))].sort((a, b) => a.localeCompare(b, 'pt'));
    districts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtFilter.appendChild(option);
    });

    // Populate city filter
    const cities = [...new Set(farmersMarkets.map(project => project.City))].sort((a, b) => a.localeCompare(b, 'pt'));
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        cityFilter.appendChild(option);
    });

    // Populate practice filter
    const practices = new Set();
    farmersMarkets.forEach(project => {
        if (project['Regenerative Practices']) {
            project['Regenerative Practices'].forEach(p => practices.add(p));
        }
    });
    [...practices].sort((a, b) => a.localeCompare(b, 'pt')).forEach(practice => {
        const option = document.createElement('option');
        option.value = practice;
        option.textContent = practice;
        practiceFilter.appendChild(option);
    });

    // Populate product filter
    const products = new Set();
    farmersMarkets.forEach(project => {
        if (project['Additional Details']) {
            project['Additional Details'].forEach(p => products.add(p));
        }
    });
    [...products].sort((a, b) => a.localeCompare(b, 'pt')).forEach(product => {
        const option = document.createElement('option');
        option.value = product;
        option.textContent = product;
        productFilter.appendChild(option);
    });
}

// Initialize event listeners
function initializeEventListeners() {
    // Search input
    searchInput.addEventListener('input', handleSearch);
    clearSearchBtn.addEventListener('click', clearSearch);

    // Filters
    districtFilter.addEventListener('change', handleFilters);
    cityFilter.addEventListener('change', handleFilters);
    practiceFilter.addEventListener('change', handleFilters);
    productFilter.addEventListener('change', handleFilters);
    radiusFilter.addEventListener('change', handleNearMeRadius);
    resetFiltersBtn.addEventListener('click', resetFilters);

    // Near Me button
    nearMeBtn.addEventListener('click', handleNearMe);

    // View toggle
    listViewBtn.addEventListener('click', () => switchView('list'));
    mapViewBtn.addEventListener('click', () => switchView('map'));
}

// Handle search functionality
function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();

    // Show/hide clear button
    clearSearchBtn.style.display = query ? 'block' : 'none';

    applyFilters();
}

// Clear search
function clearSearch() {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    applyFilters();
}

// Handle all filters
function handleFilters() {
    applyFilters();
}

// Apply all filters and search
function applyFilters() {
    const searchQuery = searchInput.value.toLowerCase().trim();
    const selectedDistrict = districtFilter.value;
    const selectedCity = cityFilter.value;
    const selectedPractice = practiceFilter.value;
    const selectedProduct = productFilter.value;

    filteredProjects = farmersMarkets.map(project => {
        // Calculate distance if Near Me is active
        if (nearMeActive && userLocation) {
            const distance = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                project.Latitude,
                project.Longitude
            );
            return { ...project, distance };
        }
        return { ...project, distance: null };
    }).filter(project => {
        // Search filter
        const matchesSearch = !searchQuery ||
            project['Project Name'].toLowerCase().includes(searchQuery) ||
            project.Country.toLowerCase().includes(searchQuery) ||
            (project.District && project.District.toLowerCase().includes(searchQuery)) ||
            project.City.toLowerCase().includes(searchQuery) ||
            project['Full Address'].toLowerCase().includes(searchQuery) ||
            (project['Regenerative Practices'] && project['Regenerative Practices'].some(p => p.toLowerCase().includes(searchQuery))) ||
            (project['Additional Details'] && project['Additional Details'].some(p => p.toLowerCase().includes(searchQuery)));

        // District filter
        const matchesDistrict = !selectedDistrict || project.District === selectedDistrict;

        // City filter
        const matchesCity = !selectedCity || project.City === selectedCity;

        // Practice filter
        const matchesPractice = !selectedPractice ||
            (project['Regenerative Practices'] && project['Regenerative Practices'].includes(selectedPractice));

        // Product filter
        const matchesProduct = !selectedProduct ||
            (project['Additional Details'] && project['Additional Details'].includes(selectedProduct));

        // Distance filter (only when Near Me is active)
        let matchesDistance = true;
        if (nearMeActive && userLocation) {
            const maxDistance = parseInt(radiusFilter.value);
            matchesDistance = project.distance <= maxDistance;
        }

        return matchesSearch && matchesDistrict && matchesCity && matchesPractice && matchesProduct && matchesDistance;
    });

    // Sort by distance if Near Me is active
    if (nearMeActive && userLocation) {
        filteredProjects.sort((a, b) => a.distance - b.distance);
    }

    displayProjects(filteredProjects);
    updateMapMarkers();
    updateResultsCount();
}

// Reset all filters
function resetFilters() {
    searchInput.value = '';
    districtFilter.value = '';
    cityFilter.value = '';
    practiceFilter.value = '';
    productFilter.value = '';
    clearSearchBtn.style.display = 'none';

    // Reset Near Me
    nearMeActive = false;
    userLocation = null;
    nearMeBtn.classList.remove('active');
    radiusFilterGroup.style.display = 'none';

    // Remove user marker from map
    if (userMarker && map) {
        map.removeLayer(userMarker);
        userMarker = null;
    }

    filteredProjects = [...farmersMarkets];
    displayProjects(filteredProjects);
    updateMapMarkers();
    updateResultsCount();
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance; // Returns distance in kilometers
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Handle Near Me button click
function handleNearMe() {
    if (nearMeActive) {
        // Deactivate Near Me
        nearMeActive = false;
        userLocation = null;
        nearMeBtn.classList.remove('active');
        radiusFilterGroup.style.display = 'none';

        // Remove user marker
        if (userMarker && map) {
            map.removeLayer(userMarker);
            userMarker = null;
        }

        applyFilters();
        return;
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser. Please use the location filters instead.');
        return;
    }

    // Show loading state
    nearMeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting location...';
    nearMeBtn.disabled = true;

    // Get user location
    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            nearMeActive = true;
            nearMeBtn.classList.add('active');
            nearMeBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Near Me (Active)';
            nearMeBtn.disabled = false;
            radiusFilterGroup.style.display = 'flex';

            // Add user marker to map
            addUserMarker();

            // Apply filters with location
            applyFilters();
        },
        (error) => {
            nearMeBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Near Me';
            nearMeBtn.disabled = false;

            let errorMessage = 'Unable to get your location. ';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage += 'You denied the location request. Please enable location access in your browser settings.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage += 'Location information is unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMessage += 'The request to get your location timed out.';
                    break;
                default:
                    errorMessage += 'An unknown error occurred.';
            }
            alert(errorMessage);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Handle radius filter change when Near Me is active
function handleNearMeRadius() {
    if (nearMeActive) {
        applyFilters();
    }
}

// Add user location marker to map
function addUserMarker() {
    if (!map || !userLocation) return;

    // Remove existing user marker
    if (userMarker) {
        map.removeLayer(userMarker);
    }

    // Create custom icon for user location
    const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: '<div style="background-color: #4285F4; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
    });

    userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<strong>Your Location</strong>');

    // Center map on user location
    map.setView([userLocation.lat, userLocation.lng], 10);
}

// Switch between list and map views
function switchView(view) {
    if (view === 'list') {
        listViewBtn.classList.add('active');
        mapViewBtn.classList.remove('active');
        listView.classList.add('active');
        mapView.classList.remove('active');
    } else {
        listViewBtn.classList.remove('active');
        mapViewBtn.classList.add('active');
        listView.classList.remove('active');
        mapView.classList.add('active');

        // Invalidate map size and fit bounds when switching to map view
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
                // Re-fit bounds to ensure proper zoom
                if (markers.length > 0) {
                    const group = new L.featureGroup(markers);
                    map.fitBounds(group.getBounds().pad(0.05), {
                        maxZoom: 12
                    });
                }
            }
        }, 100);
    }
}

// Show specific project on map
function showOnMap(projectName, lat, lng) {
    // Switch to map view
    switchView('map');

    // Wait for map to be ready, then center on the project
    setTimeout(() => {
        if (map) {
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);

            map.setView([latitude, longitude], 15);

            // Find and open the popup for this project
            markers.forEach(marker => {
                const markerLatLng = marker.getLatLng();
                if (Math.abs(markerLatLng.lat - latitude) < 0.0001 &&
                    Math.abs(markerLatLng.lng - longitude) < 0.0001) {
                    marker.openPopup();
                }
            });
        }
    }, 200);
}

// Display projects in list view
function displayProjects(projects) {
    projectsList.innerHTML = '';

    if (projects.length === 0) {
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';

    projects.forEach(project => {
        const projectCard = createProjectCard(project);
        projectsList.appendChild(projectCard);
    });
}

// Generate Operating Hours HTML
function generateOperatingHoursHTML(operatingHoursStr) {
    let hoursHTML = '<div class="additional-info operating-hours-section">';
    hoursHTML += '<span class="info-label">Operating Hours</span>';

    if (!operatingHoursStr) {
        hoursHTML += '<div class="info-text"><span class="not-available">Not Available</span></div>';
        hoursHTML += '</div>';
        return hoursHTML;
    }

    try {
        const hours = JSON.parse(operatingHoursStr);
        const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        hoursHTML += '<div class="operating-hours-grid">';

        daysOrder.forEach(day => {
            if (hours[day]) {
                const times = hours[day];
                hoursHTML += `
                    <div class="hours-row">
                        <span class="hours-day">${day}</span>
                        <span class="hours-time">${escapeHtml(times)}</span>
                    </div>
                `;
            }
        });

        hoursHTML += '</div></div>';
        return hoursHTML;
    } catch (e) {
        console.error('Error parsing Operating Hours:', e);
        hoursHTML += '<div class="info-text"><span class="not-available">Not Available</span></div>';
        hoursHTML += '</div>';
        return hoursHTML;
    }
}

// Generate LocalBusiness/AgriculturalBusiness schema for each project
function generateLocalBusinessSchema(project) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "additionalType": "https://schema.org/FarmersMarket",
        "name": project['Project Name'],
        "url": project.Website || null,
        "description": `Farmers market in ${project.City}, ${project.Country}. ${project['Regenerative Practices'] ? project['Regenerative Practices'].join(', ') : 'Local produce and artisan products'}`,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": project['Full Address'],
            "addressLocality": project.City,
            "addressCountry": project.Country
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": project.Latitude,
            "longitude": project.Longitude
        },
        "telephone": project.Phone,
        "email": project.Email || null,
        "knowsAbout": project['Regenerative Practices'] || [],
        "amenityFeature": (project['Additional Details'] || []).map(detail => ({
            "@type": "LocationFeatureSpecification",
            "name": detail
        }))
    };

    return schema;
}

// Create project card HTML
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';

    const practices = project['Regenerative Practices'] || [];
    const additionalDetails = project['Additional Details'] || [];

    // Add Schema to each card
    const schema = generateLocalBusinessSchema(project);
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.textContent = JSON.stringify(schema);
    card.appendChild(schemaScript);

    card.innerHTML = `
        <div class="project-header">
            <h2 class="project-name">${escapeHtml(project['Project Name'])}</h2>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <span class="project-district">${escapeHtml(project.City)}</span>
                ${project.distance !== null && project.distance !== undefined ? `<span class="distance-badge">${project.distance.toFixed(1)} km away</span>` : ''}
            </div>
        </div>

        <div class="project-body">
            <div class="project-info">
                <div class="info-item">
                    <i class="fas fa-map-marker-alt info-icon"></i>
                    <div class="info-content">
                        <span class="info-label">Location</span>
                        <div class="info-text">${escapeHtml(project.City)}${project.District ? `, ${escapeHtml(project.District)}` : ''}</div>
                    </div>
                </div>
                
                <div class="info-item">
                    <i class="fas fa-phone info-icon"></i>
                    <div class="info-content">
                        <span class="info-label">Phone</span>
                        <div class="info-text">
                            ${project.Phone ? `<a href="tel:${project.Phone}">${escapeHtml(project.Phone)}</a>` : '<span class="not-available">Not Available</span>'}
                        </div>
                    </div>
                </div>
                
                <div class="info-item">
                    <i class="fas fa-envelope info-icon"></i>
                    <div class="info-content">
                        <span class="info-label">Email</span>
                        <div class="info-text">
                            ${project.Email ? `<a href="mailto:${project.Email}">${escapeHtml(project.Email)}</a>` : '<span class="not-available">Not Available</span>'}
                        </div>
                    </div>
                </div>
                
                <div class="info-item">
                    <i class="fas fa-globe info-icon"></i>
                    <div class="info-content">
                        <span class="info-label">Website</span>
                        <div class="info-text">
                            ${project.Website ? `<a href="${project.Website}" target="_blank" rel="noopener noreferrer">Visit website</a>` : '<span class="not-available">Not Available</span>'}
                        </div>
                    </div>
                </div>
            </div>

            ${generateOperatingHoursHTML(project['Operating Hours'])}

            ${practices.length > 0 ? `
            <div class="additional-info">
                <span class="info-label">Type</span>
                <div class="services-list">
                    ${practices.map(practice => `<span class="service-tag practice-tag">${escapeHtml(practice)}</span>`).join('')}
                </div>
            </div>
            ` : ''}

            ${additionalDetails.length > 0 ? `
            <div class="additional-info">
                <span class="info-label">Amenities</span>
                <div class="services-list">
                    ${additionalDetails.map(detail => `<span class="service-tag product-tag">${escapeHtml(detail)}</span>`).join('')}
                </div>
            </div>
            ` : ''}

            <div class="project-actions">
                <button class="show-on-map-btn" onclick="showOnMap('${escapeHtml(project['Project Name'])}', ${project.Latitude}, ${project.Longitude})">
                    <i class="fas fa-map-marker-alt"></i>
                    View on map
                </button>
            </div>
        </div>
    `;

    return card;
}

// Update results count
function updateResultsCount() {
    resultsCount.textContent = filteredProjects.length;
}

// Initialize Leaflet map
function initializeMap() {
    // Initialize map without specific view - we'll fit to markers
    map = L.map('map').setView([39.5, -8.0], 7); // Default center on Portugal

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add initial markers and fit view
    updateMapMarkers();
}

// Update map markers based on filtered projects
function updateMapMarkers() {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Add markers for filtered projects
    filteredProjects.forEach(project => {
        const lat = parseFloat(project.Latitude);
        const lng = parseFloat(project.Longitude);

        if (lat && lng) {
            const marker = L.marker([lat, lng]).addTo(map);

            const popupContent = createMapPopupContent(project);
            marker.bindPopup(popupContent);

            markers.push(marker);
        }
    });

    // Adjust map view to fit all markers
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.05), {
            maxZoom: 12 // Prevent zooming in too much for single markers
        });
    } else {
        // Fallback to Portugal view if no markers
        map.setView([39.5, -8.0], 7);
    }
}

// Create popup content for map markers
function createMapPopupContent(project) {
    return `
        <div class="popup-content">
            <h3 class="popup-title">${escapeHtml(project['Project Name'])}</h3>
            <span class="popup-district">${escapeHtml(project.City)}</span>
            
            <div class="popup-info">
                <div class="popup-info-item">
                    <i class="fas fa-map-marker-alt popup-icon"></i>
                    <span>${escapeHtml(project.City)}${project.District ? `, ${escapeHtml(project.District)}` : ''}</span>
                </div>
                
                <div class="popup-info-item">
                    <i class="fas fa-phone popup-icon"></i>
                    ${project.Phone ? `<a href="tel:${project.Phone}">${escapeHtml(project.Phone)}</a>` : '<span class="not-available">Not Available</span>'}
                </div>
                
                <div class="popup-info-item">
                    <i class="fas fa-globe popup-icon"></i>
                    ${project.Website ? `<a href="${project.Website}" target="_blank" rel="noopener noreferrer">Website</a>` : '<span class="not-available">Not Available</span>'}
                </div>
            </div>
        </div>
    `;
}

// Utility function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, function (m) { return map[m]; });
}

// Handle window resize for map
window.addEventListener('resize', function () {
    if (map && mapView.classList.contains('active')) {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
});
