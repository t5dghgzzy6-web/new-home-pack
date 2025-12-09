// Developments Management
let developments = [];

// Load developments on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDevelopments();
    updateUserName();
});

function updateUserName() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.name) {
        document.getElementById('userName').textContent = currentUser.name;
    }
}

function loadDevelopments() {
    // Load from localStorage
    const stored = localStorage.getItem('developments');
    if (stored) {
        developments = JSON.parse(stored);
    } else {
        // Demo data
        developments = [
            {
                id: 'dev1',
                name: 'Riverside Gardens',
                location: 'Manchester, Greater Manchester',
                description: 'Luxury 3 & 4 bedroom homes overlooking the River Irwell',
                totalPlots: 24,
                availablePlots: 18,
                reservedPlots: 4,
                soldPlots: 2,
                status: 'selling',
                image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
                createdDate: new Date('2024-01-15').toISOString()
            },
            {
                id: 'dev2',
                name: 'Parkside View',
                location: 'Leeds, West Yorkshire',
                description: 'Modern 2 & 3 bedroom apartments with park views',
                totalPlots: 36,
                availablePlots: 28,
                reservedPlots: 6,
                soldPlots: 2,
                status: 'selling',
                image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
                createdDate: new Date('2024-02-01').toISOString()
            },
            {
                id: 'dev3',
                name: 'Oakfield Rise',
                location: 'Birmingham, West Midlands',
                description: 'Executive 4 & 5 bedroom family homes',
                totalPlots: 18,
                availablePlots: 15,
                reservedPlots: 2,
                soldPlots: 1,
                status: 'construction',
                image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
                createdDate: new Date('2023-11-20').toISOString()
            }
        ];
        localStorage.setItem('developments', JSON.stringify(developments));
    }
    
    renderDevelopments();
}

function renderDevelopments() {
    const grid = document.getElementById('developmentsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (developments.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    grid.innerHTML = developments.map(dev => `
        <div class="card" style="overflow: hidden;">
            ${dev.image ? `
                <img src="${dev.image}" alt="${dev.name}" style="width: 100%; height: 200px; object-fit: cover;">
            ` : `
                <div style="width: 100%; height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">
                    🏗️
                </div>
            `}
            
            <div style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                    <h3 style="font-size: 1.25rem; font-weight: 600; color: #1F2937; margin: 0;">${dev.name}</h3>
                    ${getStatusBadge(dev.status)}
                </div>
                
                <p style="color: #6B7280; font-size: 0.875rem; margin-bottom: 1rem;">
                    📍 ${dev.location}
                </p>
                
                ${dev.description ? `
                    <p style="color: #6B7280; font-size: 0.875rem; margin-bottom: 1rem; line-height: 1.5;">
                        ${dev.description}
                    </p>
                ` : ''}
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1.5rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #10b981;">${dev.availablePlots || 0}</div>
                        <div style="font-size: 0.75rem; color: #6B7280; text-transform: uppercase;">Available</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #f59e0b;">${dev.reservedPlots || 0}</div>
                        <div style="font-size: 0.75rem; color: #6B7280; text-transform: uppercase;">Reserved</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: #6B7280;">${dev.soldPlots || 0}</div>
                        <div style="font-size: 0.75rem; color: #6B7280; text-transform: uppercase;">Sold</div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary" style="flex: 1;" onclick="viewDevelopment('${dev.id}')">
                        View Details
                    </button>
                    <button class="btn btn-secondary" onclick="editDevelopment('${dev.id}')">
                        ✏️
                    </button>
                    <button class="btn btn-secondary" onclick="deleteDevelopment('${dev.id}')">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function getStatusBadge(status) {
    const badges = {
        planning: '<span class="badge" style="background-color: #e0e7ff; color: #4338ca;">Planning</span>',
        construction: '<span class="badge" style="background-color: #fef3c7; color: #92400e;">Under Construction</span>',
        selling: '<span class="badge" style="background-color: #d1fae5; color: #065f46;">Now Selling</span>',
        completed: '<span class="badge" style="background-color: #e5e7eb; color: #374151;">Completed</span>'
    };
    return badges[status] || '';
}

function showAddDevelopmentModal() {
    document.getElementById('addDevelopmentModal').classList.add('active');
}

function closeAddDevelopmentModal() {
    document.getElementById('addDevelopmentModal').classList.remove('active');
    document.getElementById('addDevelopmentForm').reset();
}

function handleAddDevelopment(event) {
    event.preventDefault();
    
    const newDevelopment = {
        id: 'dev' + Date.now(),
        name: document.getElementById('devName').value,
        location: document.getElementById('devLocation').value,
        description: document.getElementById('devDescription').value,
        totalPlots: parseInt(document.getElementById('devTotalPlots').value),
        availablePlots: parseInt(document.getElementById('devTotalPlots').value),
        reservedPlots: 0,
        soldPlots: 0,
        status: document.getElementById('devStatus').value,
        image: document.getElementById('devImage').value || null,
        createdDate: new Date().toISOString()
    };
    
    developments.unshift(newDevelopment);
    localStorage.setItem('developments', JSON.stringify(developments));
    
    closeAddDevelopmentModal();
    renderDevelopments();
    
    // Show success message
    alert('Development added successfully!');
}

function viewDevelopment(id) {
    // For now, redirect to plots page with development filter
    window.location.href = `plots.html?development=${id}`;
}

function editDevelopment(id) {
    // TODO: Implement edit functionality
    alert('Edit functionality coming soon!');
}

function deleteDevelopment(id) {
    if (confirm('Are you sure you want to delete this development? This action cannot be undone.')) {
        developments = developments.filter(d => d.id !== id);
        localStorage.setItem('developments', JSON.stringify(developments));
        renderDevelopments();
    }
}
