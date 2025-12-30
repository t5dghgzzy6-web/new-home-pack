// Plot Management Logic

document.addEventListener('DOMContentLoaded', () => {
    const user = checkAuth();
    if (!user) return;

    if (document.getElementById('userName')) {
        document.getElementById('userName').textContent = user.name;
    }

    loadPlots();
    setupFilters();
});

// Demo plot data (in production, this would come from API)
let plots = [
    // Will be loaded from developments in localStorage
];

function loadPlots() {
    // Load all plots from all developments in localStorage
    plots = [];
    const stored = localStorage.getItem('developments');
    if (stored) {
        const devs = JSON.parse(stored);
        let idCounter = 1;
        devs.forEach(dev => {
            if (dev.plots && Array.isArray(dev.plots)) {
                dev.plots.forEach(plot => {
                    plots.push({
                        id: idCounter++,
                        number: plot.number,
                        development: dev.name,
                        type: plot.type,
                        bedrooms: plot.bedrooms,
                        price: plot.price,
                        status: plot.status,
                        downloads: plot.downloads || 0,
                        buyer: plot.buyer || null
                    });
                });
            }
        });
    }
    renderPlotsTable();
    // Debug: Output loaded plots to console and page
    console.log('Loaded plots:', plots);
    let debugDiv = document.getElementById('plotsDebug');
    if (!debugDiv) {
        debugDiv = document.createElement('div');
        debugDiv.id = 'plotsDebug';
        debugDiv.style = 'margin:1rem 0;padding:1rem;background:#f3f4f6;color:#374151;font-size:0.9rem;max-height:200px;overflow:auto;';
        const main = document.querySelector('main') || document.body;
        main.insertBefore(debugDiv, main.firstChild);
    }
    debugDiv.innerHTML = '<strong>Debug: Loaded Plots</strong><pre>' + JSON.stringify(plots, null, 2) + '</pre>';
}

function renderPlotsTable() {
    const tbody = document.querySelector('#plotsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    plots.forEach(plot => {
        const row = createPlotRow(plot);
        tbody.appendChild(row);
    });
}
}

function setupFilters() {
    const developmentFilter = document.getElementById('filterDevelopment');
    const statusFilter = document.getElementById('filterStatus');
    const searchInput = document.getElementById('searchPlot');

    if (developmentFilter) {
        developmentFilter.addEventListener('change', filterPlots);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', filterPlots);
    }
    if (searchInput) {
        searchInput.addEventListener('input', filterPlots);
    }
}

function filterPlots() {
    const development = document.getElementById('filterDevelopment')?.value || '';
    const status = document.getElementById('filterStatus')?.value || '';
    const search = document.getElementById('searchPlot')?.value.toLowerCase() || '';

    const tbody = document.querySelector('#plotsTable tbody');
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
        const rowDevelopment = row.cells[1].textContent;
        const rowStatus = row.cells[5].textContent.toLowerCase();
        const rowText = row.textContent.toLowerCase();

        const matchesDevelopment = !development || rowDevelopment.toLowerCase().includes(development);
        const matchesStatus = !status || rowStatus.includes(status);
        const matchesSearch = !search || rowText.includes(search);

        if (matchesDevelopment && matchesStatus && matchesSearch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function openAddPlotModal() {
    document.getElementById('addPlotModal').style.display = 'flex';
}

function closeAddPlotModal() {
    document.getElementById('addPlotModal').style.display = 'none';
    document.getElementById('addPlotForm').reset();
}

function openBulkImportModal() {
    alert('Bulk import feature coming soon! You will be able to upload a CSV file with multiple plots.');
}

function savePlot() {
    const form = document.getElementById('addPlotForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    const newPlot = {
        id: plots.length + 1,
        number: formData.get('plotNumber'),
        development: document.getElementById('development').selectedOptions[0].text,
        type: document.getElementById('propertyType').selectedOptions[0].text,
        bedrooms: formData.get('bedrooms'),
        price: formData.get('price'),
        status: formData.get('plotStatus'),
        downloads: 0,
        buyer: null
    };

    plots.push(newPlot);
    
    // Add row to table
    const tbody = document.querySelector('#plotsTable tbody');
    const row = createPlotRow(newPlot);
    tbody.insertBefore(row, tbody.firstChild);

    closeAddPlotModal();
    alert(`Plot ${newPlot.number} added successfully!`);
}

function createPlotRow(plot) {
    const row = document.createElement('tr');
    const statusBadge = getStatusBadge(plot.status);
    
    row.innerHTML = `
        <td><strong>${plot.number}</strong></td>
        <td>${plot.development}</td>
        <td>${plot.type}</td>
        <td>${plot.bedrooms}</td>
        <td>£${parseInt(plot.price).toLocaleString()}</td>
        <td>${statusBadge}</td>
        <td>${plot.downloads}</td>
        <td>${plot.buyer || '-'}</td>
        <td>
            <a href="#" onclick="viewPlot(${plot.id})" class="form-link">View</a> | 
            <a href="#" onclick="editPlot(${plot.id})" class="form-link">Edit</a>
        </td>
    `;
    
    return row;
}

function getStatusBadge(status) {
    const badges = {
        'available': '<span class="badge badge-available">Available</span>',
        'reserved': '<span class="badge badge-reserved">Reserved</span>',
        'exchanged': '<span class="badge badge-exchanged">Exchanged</span>',
        'completed': '<span class="badge badge-completed">Completed</span>'
    };
    return badges[status] || status;
}

function viewPlot(id) {
    const plot = plots.find(p => p.id === id);
    if (plot) {
        alert(`Viewing Plot ${plot.number}\n\nDevelopment: ${plot.development}\nType: ${plot.type}\nBedrooms: ${plot.bedrooms}\nPrice: £${parseInt(plot.price).toLocaleString()}\nStatus: ${plot.status}\nDownloads: ${plot.downloads}\nBuyer: ${plot.buyer || 'None'}\n\n(Full plot details page coming soon!)`);
    }
}

function editPlot(id) {
    alert('Edit plot feature coming soon!');
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    const modal = document.getElementById('addPlotModal');
    if (e.target === modal) {
        closeAddPlotModal();
    }
});
