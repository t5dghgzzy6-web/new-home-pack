// Public Plots Listing Page

// Demo plot data (in production, this would come from API)
const plots = [
    {
        id: 1,
        number: 'Plot 1',
        development: 'Greenfield Gardens',
        developmentSlug: 'greenfield',
        type: 'Detached',
        typeSlug: 'detached',
        bedrooms: 4,
        bathrooms: 3,
        price: 425000,
        sqft: 1850,
        image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        downloads: 24,
        status: 'available',
        description: 'Stunning 4-bedroom detached home with spacious garden and driveway.',
        features: ['En-suite', 'Garden', 'Driveway', 'Double Garage']
    },
    {
        id: 2,
        number: 'Plot 2',
        development: 'Greenfield Gardens',
        developmentSlug: 'greenfield',
        type: 'Semi-Detached',
        typeSlug: 'semi-detached',
        bedrooms: 3,
        bathrooms: 2,
        price: 325000,
        sqft: 1200,
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
        downloads: 18,
        status: 'available',
        description: 'Modern 3-bedroom semi-detached home perfect for families.',
        features: ['En-suite', 'Garden', 'Parking']
    },
    {
        id: 3,
        number: 'Plot 7',
        development: 'Riverside Heights',
        developmentSlug: 'riverside',
        type: 'Apartment',
        typeSlug: 'apartment',
        bedrooms: 2,
        bathrooms: 2,
        price: 245000,
        sqft: 850,
        image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
        downloads: 31,
        status: 'available',
        description: 'Contemporary 2-bedroom apartment with balcony and river views.',
        features: ['Balcony', 'Parking', 'Concierge']
    },
    {
        id: 4,
        number: 'Plot 12',
        development: 'Riverside Heights',
        developmentSlug: 'riverside',
        type: 'Townhouse',
        typeSlug: 'townhouse',
        bedrooms: 3,
        bathrooms: 2,
        price: 365000,
        sqft: 1400,
        image: 'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&q=80',
        downloads: 15,
        status: 'available',
        description: '3-bedroom townhouse across three floors with rooftop terrace.',
        features: ['Roof Terrace', 'Garden', 'Parking']
    },
    {
        id: 5,
        number: 'Plot 5',
        development: 'Oakwood Manor',
        developmentSlug: 'oakwood',
        type: 'Detached',
        typeSlug: 'detached',
        bedrooms: 5,
        bathrooms: 4,
        price: 595000,
        sqft: 2500,
        image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
        downloads: 12,
        status: 'available',
        description: 'Luxury 5-bedroom detached home with home office and landscaped gardens.',
        features: ['Home Office', 'En-suite x3', 'Double Garage', 'Large Garden']
    },
    {
        id: 6,
        number: 'Plot 18',
        development: 'Greenfield Gardens',
        developmentSlug: 'greenfield',
        type: 'Terraced',
        typeSlug: 'terraced',
        bedrooms: 2,
        bathrooms: 1,
        price: 215000,
        sqft: 950,
        image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
        downloads: 22,
        status: 'available',
        description: 'Compact 2-bedroom terraced home, ideal for first-time buyers.',
        features: ['Garden', 'Parking']
    },
    {
        id: 7,
        number: 'Plot 22',
        development: 'Riverside Heights',
        developmentSlug: 'riverside',
        type: 'Apartment',
        typeSlug: 'apartment',
        bedrooms: 1,
        bathrooms: 1,
        price: 185000,
        sqft: 600,
        image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
        downloads: 28,
        status: 'available',
        description: '1-bedroom apartment perfect for professionals or investors.',
        features: ['Balcony', 'Gym', 'Concierge']
    },
    {
        id: 8,
        number: 'Plot 8',
        development: 'Oakwood Manor',
        developmentSlug: 'oakwood',
        type: 'Detached',
        typeSlug: 'detached',
        bedrooms: 4,
        bathrooms: 3,
        price: 475000,
        sqft: 2000,
        image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
        downloads: 19,
        status: 'available',
        description: 'Executive 4-bedroom home with integral garage and south-facing garden.',
        features: ['En-suite x2', 'Garage', 'Garden', 'Study']
    },
    {
        id: 9,
        number: 'Plot 14',
        development: 'Greenfield Gardens',
        developmentSlug: 'greenfield',
        type: 'Semi-Detached',
        typeSlug: 'semi-detached',
        bedrooms: 4,
        bathrooms: 2,
        price: 385000,
        sqft: 1500,
        image: 'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&q=80',
        downloads: 16,
        status: 'available',
        description: 'Spacious 4-bedroom semi with open-plan living.',
        features: ['En-suite', 'Garden', 'Driveway']
    },
    {
        id: 10,
        number: 'Plot 3',
        development: 'Riverside Heights',
        developmentSlug: 'riverside',
        type: 'Townhouse',
        typeSlug: 'townhouse',
        bedrooms: 2,
        bathrooms: 2,
        price: 295000,
        sqft: 1100,
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
        downloads: 21,
        status: 'available',
        description: '2-bedroom townhouse with courtyard garden.',
        features: ['Courtyard', 'Parking', 'Storage']
    },
    {
        id: 11,
        number: 'Plot 11',
        development: 'Oakwood Manor',
        developmentSlug: 'oakwood',
        type: 'Detached',
        typeSlug: 'detached',
        bedrooms: 3,
        bathrooms: 2,
        price: 395000,
        sqft: 1650,
        image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80',
        downloads: 14,
        status: 'available',
        description: '3-bedroom detached bungalow with accessible design.',
        features: ['Single Storey', 'Garden', 'Garage']
    },
    {
        id: 12,
        number: 'Plot 25',
        development: 'Greenfield Gardens',
        developmentSlug: 'greenfield',
        type: 'Apartment',
        typeSlug: 'apartment',
        bedrooms: 2,
        bathrooms: 1,
        price: 235000,
        sqft: 800,
        image: 'https://images.unsplash.com/photo-1600573472591-ee6c4d33856b?w=800&q=80',
        downloads: 26,
        status: 'available',
        description: 'Ground floor 2-bedroom apartment with private patio.',
        features: ['Patio', 'Parking', 'Storage']
    }
];

let filteredPlots = [...plots];

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    renderPlots();
    setupFilters();
    updateCount();
});

function renderPlots() {
    const grid = document.getElementById('plotsGrid');
    const noResults = document.getElementById('noResults');
    
    if (filteredPlots.length === 0) {
        grid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    noResults.style.display = 'none';
    
    grid.innerHTML = filteredPlots.map(plot => `
        <div class="feature-card" style="cursor: pointer; transition: transform 0.3s;" onclick="viewPlot(${plot.id})">
            <div style="position: relative; overflow: hidden; border-radius: 8px 8px 0 0; margin: -1.5rem -1.5rem 1rem -1.5rem;">
                <img src="${plot.image}" alt="${plot.number}" style="width: 100%; height: 200px; object-fit: cover;">
                <div style="position: absolute; top: 1rem; right: 1rem; background: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.875rem; font-weight: 600; color: var(--primary-black);">
                    ${plot.bedrooms} Bed
                </div>
                <div style="position: absolute; bottom: 1rem; left: 1rem; background: var(--primary-red); color: white; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 700;">
                    £${plot.price.toLocaleString()}
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                <div>
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--primary-black); margin-bottom: 0.25rem;">${plot.number}</h3>
                    <p style="color: var(--gray-600); font-size: 0.875rem;">${plot.development}</p>
                </div>
                <span style="background: var(--gray-100); padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; color: var(--gray-700);">${plot.type}</span>
            </div>
            
            <p style="color: var(--gray-600); margin-bottom: 1rem; font-size: 0.875rem; line-height: 1.5;">${plot.description}</p>
            
            <div style="display: flex; gap: 1rem; margin-bottom: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-200);">
                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--gray-700);">
                    <span>🛏️</span>
                    <span>${plot.bedrooms} Beds</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--gray-700);">
                    <span>🚿</span>
                    <span>${plot.bathrooms} Baths</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--gray-700);">
                    <span>📏</span>
                    <span>${plot.sqft} sq ft</span>
                </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;">
                ${plot.features.slice(0, 3).map(feature => `
                    <span style="background: var(--gray-50); padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.75rem; color: var(--gray-700);">✓ ${feature}</span>
                `).join('')}
            </div>
            
            <div style="display: flex; gap: 0.5rem;">
                <a href="plot-detail.html?id=${plot.id}" class="btn btn-primary" style="flex: 1; text-align: center; text-decoration: none;" onclick="event.stopPropagation();">View Details</a>
                <button class="btn btn-secondary" onclick="event.stopPropagation(); downloadPack(${plot.id});" style="white-space: nowrap;">
                    📥 Download Pack
                </button>
            </div>
            
            <div style="margin-top: 0.75rem; text-align: center; font-size: 0.75rem; color: var(--gray-500);">
                ${plot.downloads} pack downloads
            </div>
        </div>
    `).join('');
}

function setupFilters() {
    document.getElementById('filterDevelopment').addEventListener('change', applyFilters);
    document.getElementById('filterBedrooms').addEventListener('change', applyFilters);
    document.getElementById('filterType').addEventListener('change', applyFilters);
    document.getElementById('filterPrice').addEventListener('change', applyFilters);
    document.getElementById('sortBy').addEventListener('change', applySort);
}

function applyFilters() {
    const development = document.getElementById('filterDevelopment').value;
    const bedrooms = document.getElementById('filterBedrooms').value;
    const type = document.getElementById('filterType').value;
    const maxPrice = document.getElementById('filterPrice').value;
    
    filteredPlots = plots.filter(plot => {
        if (development && plot.developmentSlug !== development) return false;
        if (bedrooms && plot.bedrooms < parseInt(bedrooms)) return false;
        if (type && plot.typeSlug !== type) return false;
        if (maxPrice && plot.price > parseInt(maxPrice)) return false;
        return true;
    });
    
    applySort();
}

function applySort() {
    const sortBy = document.getElementById('sortBy').value;
    
    switch(sortBy) {
        case 'price-asc':
            filteredPlots.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredPlots.sort((a, b) => b.price - a.price);
            break;
        case 'beds-desc':
            filteredPlots.sort((a, b) => b.bedrooms - a.bedrooms);
            break;
        case 'newest':
            filteredPlots.sort((a, b) => b.id - a.id);
            break;
    }
    
    renderPlots();
    updateCount();
}

function updateCount() {
    document.getElementById('plotCount').textContent = `Showing ${filteredPlots.length} ${filteredPlots.length === 1 ? 'property' : 'properties'}`;
}

function viewPlot(id) {
    window.location.href = `plot-detail.html?id=${id}`;
}

function downloadPack(id) {
    const plot = plots.find(p => p.id === id);
    if (plot) {
        // In production, this would require registration/login
        alert(`To download the property pack for ${plot.number}, please sign in or create a free account.\n\nThe pack includes:\n✓ Title plans\n✓ Floor plans\n✓ Plot specifications\n✓ Legal documents\n✓ NHBC warranty details\n✓ Service charge information`);
        window.location.href = `portal/signup.html?plot=${id}`;
    }
}
