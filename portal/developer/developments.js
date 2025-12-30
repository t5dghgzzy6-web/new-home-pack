// Developments Management
let developments = [];

// Load developments on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDevelopments();
    updateUserName();
    setupBulkImportModal();
    populateImportTarget();
    setupPhaseUI();
// MVP Phase Management Logic
function setupPhaseUI() {
    document.getElementById('phasesSection')?.addEventListener('click', renderPhasesList);
    renderPhasesList();
}

function showAddPhaseModal() {
    document.getElementById('addPhaseModal').style.display = 'block';
}
function closeAddPhaseModal() {
    document.getElementById('addPhaseModal').style.display = 'none';
    document.getElementById('addPhaseForm').reset();
}

function handleAddPhase(event) {
    event.preventDefault();
    // For MVP, add phase to first development
    if (developments.length === 0) return;
    const dev = developments[0];
    dev.phases = dev.phases || [];
    const phaseId = 'phase-' + Date.now() + '-' + Math.random().toString(36).substr(2,5);
    const phaseName = document.getElementById('phaseName').value;
    dev.phases.push({ id: phaseId, name: phaseName, plots: [], documents: [] });
    localStorage.setItem('developments', JSON.stringify(developments));
    closeAddPhaseModal();
    renderPhasesList();
}

function renderPhasesList() {
    const phasesList = document.getElementById('phasesList');
    if (!phasesList) return;
    if (developments.length === 0) {
        phasesList.innerHTML = '<p>No developments found.</p>';
        return;
    }
    const dev = developments[0];
    dev.phases = dev.phases || [];
    if (dev.phases.length === 0) {
        phasesList.innerHTML = '<p>No phases added yet.</p>';
        return;
    }
    phasesList.innerHTML = dev.phases.map(phase => `
        <div class="phase-card" style="border:1px solid #e5e7eb; border-radius:8px; padding:1rem; margin-bottom:1rem;">
            <h3 style="margin:0 0 0.5rem 0;">${phase.name}</h3>
            <p>Plots: ${phase.plots.length > 0 ? phase.plots.join(', ') : 'None assigned'}</p>
            <p>Documents: ${phase.documents.length > 0 ? phase.documents.join(', ') : 'None assigned'}</p>
            <button class="btn btn-secondary" onclick="showAssignPlotsModal('${phase.id}')">Assign Plots</button>
            <button class="btn btn-secondary" onclick="showAssignDocumentsModal('${phase.id}')">Assign Documents</button>
        </div>
    `).join('');
}
});
// Populate the import target dropdown with existing developments
function populateImportTarget() {
    const select = document.getElementById('importTarget');
    if (!select) return;
    // Remove all except 'new'
    while (select.options.length > 1) select.remove(1);
    developments.forEach(dev => {
        const opt = document.createElement('option');
        opt.value = dev.id;
        opt.textContent = `Existing: ${dev.name} (${dev.location})`;
        select.appendChild(opt);
    });
}
// Bulk Import Modal logic
function showBulkImportModal() {
    document.getElementById('bulkImportModal').style.display = 'block';
    document.getElementById('bulkImportResult').style.display = 'none';
    populateImportTarget();
}
function closeBulkImportModal() {
    document.getElementById('bulkImportModal').style.display = 'none';
}
function setupBulkImportModal() {
    // Close modal on outside click
    window.onclick = function(event) {
        const modal = document.getElementById('bulkImportModal');
        if (event.target === modal) {
            closeBulkImportModal();
        }
    };
}

function downloadSampleCSV() {
    const csv = `Development Name,Location,Description,Status,Main Image URL,Plot Number,Plot Type,Bedrooms,Bathrooms,Price,Plot Status\nRiverside Gardens,Manchester,Luxury riverside homes,selling,https://example.com/image.jpg,1,House,3,2,350000,available\nRiverside Gardens,Manchester,Luxury riverside homes,selling,https://example.com/image.jpg,2,House,4,3,425000,reserved`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sample_development_import.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleBulkImport(event) {
    event.preventDefault();
    const fileInput = document.getElementById('bulkFile');
    const file = fileInput.files[0];
    const importTarget = document.getElementById('importTarget').value;
    if (!file) return;
    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            const rows = results.data;
            let imported = 0;
            let dev = null;
            let importSummary = [];
            let devsImported = new Set();
            if (importTarget !== 'new') {
                // Import to existing development
                dev = developments.find(d => d.id === importTarget);
                if (!dev) {
                    document.getElementById('bulkImportResult').textContent = 'Selected development not found.';
                    document.getElementById('bulkImportResult').style.color = '#DC2626';
                    document.getElementById('bulkImportResult').style.display = 'block';
                    return;
                }
                dev.plots = dev.plots || [];
                devsImported.add(`${dev.name} (${dev.location})`);
            }
            rows.forEach(row => {
                if (importTarget === 'new') {
                    // Find or create development by name/location in CSV
                    let found = developments.find(d => d.name === row['Development Name'] && d.location === row['Location']);
                    if (!found) {
                        found = {
                            id: 'dev-' + Date.now() + '-' + Math.random().toString(36).substr(2,5),
                            name: row['Development Name'],
                            location: row['Location'],
                            description: row['Description'],
                            status: row['Status'],
                            image: row['Main Image URL'],
                            totalPlots: 0,
                            availablePlots: 0,
                            reservedPlots: 0,
                            soldPlots: 0,
                            plots: [],
                            createdDate: new Date().toISOString()
                        };
                        developments.push(found);
                    }
                    dev = found;
                    devsImported.add(`${dev.name} (${dev.location})`);
                }
                // Add plot
                if (row['Plot Number']) {
                    const plot = {
                        number: row['Plot Number'],
                        type: row['Plot Type'],
                        bedrooms: parseInt(row['Bedrooms'] || '0'),
                        bathrooms: parseInt(row['Bathrooms'] || '0'),
                        price: parseFloat(row['Price'] || '0'),
                        status: row['Plot Status']
                    };
                    dev.plots = dev.plots || [];
                    dev.plots.push(plot);
                    dev.totalPlots++;
                    if (plot.status === 'available') dev.availablePlots++;
                    if (plot.status === 'reserved') dev.reservedPlots++;
                    if (plot.status === 'sold') dev.soldPlots++;
                }
                imported++;
            });
            localStorage.setItem('developments', JSON.stringify(developments));
            renderDevelopments();
            const devList = Array.from(devsImported).join(', ');
            document.getElementById('bulkImportResult').textContent = `Imported ${imported} plots successfully into: ${devList}`;
            document.getElementById('bulkImportResult').style.display = 'block';
        },
        error: function() {
            document.getElementById('bulkImportResult').textContent = 'Error parsing CSV.';
            document.getElementById('bulkImportResult').style.color = '#DC2626';
            document.getElementById('bulkImportResult').style.display = 'block';
        }
    });
}

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
