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
    { id: 1, number: 'Plot 1', development: 'Greenfield Gardens', type: 'Detached', bedrooms: 4, price: 425000, status: 'reserved', downloads: 8, buyer: 'John Smith' },
    { id: 2, number: 'Plot 2', development: 'Greenfield Gardens', type: 'Semi-Detached', bedrooms: 3, price: 325000, status: 'available', downloads: 15, buyer: null },
    { id: 3, number: 'Plot 3', development: 'Riverside Heights', type: 'Apartment', bedrooms: 2, price: 245000, status: 'exchanged', downloads: 6, buyer: 'Sarah Jones' },
    { id: 4, number: 'Plot 4', development: 'Riverside Heights', type: 'Townhouse', bedrooms: 3, price: 365000, status: 'available', downloads: 22, buyer: null },
    { id: 5, number: 'Plot 5', development: 'Oakwood Manor', type: 'Detached', bedrooms: 5, price: 595000, status: 'completed', downloads: 4, buyer: 'Emma Wilson' }
];

function loadPlots() {
    // In production, fetch from API
    console.log('Plots loaded:', plots.length);
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
