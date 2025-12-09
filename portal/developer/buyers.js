// Buyers Management
let buyers = [];
let filteredBuyers = [];

// Load buyers on page load
document.addEventListener('DOMContentLoaded', () => {
    loadBuyers();
    loadDevelopmentsFilter();
    updateUserName();
});

function updateUserName() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.name) {
        document.getElementById('userName').textContent = currentUser.name;
    }
}

function loadBuyers() {
    // Get buyers from reservations
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    
    // Extract unique buyers
    const buyersMap = new Map();
    
    reservations.forEach(reservation => {
        // Add primary buyer
        if (reservation.buyerName && reservation.buyerEmail) {
            const key = reservation.buyerEmail.toLowerCase();
            if (!buyersMap.has(key)) {
                buyersMap.set(key, {
                    name: reservation.buyerName,
                    email: reservation.buyerEmail,
                    phone: reservation.buyerPhone || 'Not provided',
                    plot: reservation.plotName || 'N/A',
                    development: reservation.developmentName || 'N/A',
                    status: getStatusFromReservation(reservation.status),
                    lastActivity: reservation.date,
                    reservationId: reservation.id
                });
            }
        }
        
        // Add additional buyers
        if (reservation.buyers && reservation.buyers.length > 1) {
            reservation.buyers.slice(1).forEach(buyer => {
                const key = buyer.email.toLowerCase();
                if (!buyersMap.has(key)) {
                    buyersMap.set(key, {
                        name: buyer.name,
                        email: buyer.email,
                        phone: buyer.phone || 'Not provided',
                        plot: reservation.plotName || 'N/A',
                        development: reservation.developmentName || 'N/A',
                        status: getStatusFromReservation(reservation.status),
                        lastActivity: reservation.date,
                        reservationId: reservation.id,
                        additionalBuyer: true
                    });
                }
            });
        }
    });
    
    buyers = Array.from(buyersMap.values());
    
    // Add demo enquiries if no buyers
    if (buyers.length === 0) {
        buyers = [
            {
                name: 'Sarah Johnson',
                email: 'sarah.johnson@email.com',
                phone: '07700 900123',
                plot: 'Plot 12',
                development: 'Riverside Gardens',
                status: 'enquiry',
                lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                name: 'Michael Chen',
                email: 'michael.chen@email.com',
                phone: '07700 900456',
                plot: 'Plot 8',
                development: 'Parkside View',
                status: 'viewing',
                lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
    }
    
    filteredBuyers = [...buyers];
    updateSummaryCards();
    renderBuyers();
}

function getStatusFromReservation(reservationStatus) {
    const statusMap = {
        'pending_signature': 'reserved',
        'fully_signed': 'reserved',
        'solicitors_instructed': 'exchanged',
        'exchanged': 'exchanged',
        'completed': 'completed'
    };
    return statusMap[reservationStatus] || 'enquiry';
}

function updateSummaryCards() {
    document.getElementById('totalBuyers').textContent = buyers.length;
    document.getElementById('activeBuyers').textContent = buyers.filter(b => b.status === 'reserved').length;
    document.getElementById('enquiries').textContent = buyers.filter(b => b.status === 'enquiry' || b.status === 'viewing').length;
    document.getElementById('completedBuyers').textContent = buyers.filter(b => b.status === 'completed' || b.status === 'exchanged').length;
}

function loadDevelopmentsFilter() {
    const developments = JSON.parse(localStorage.getItem('developments') || '[]');
    const select = document.getElementById('developmentFilter');
    
    developments.forEach(dev => {
        const option = document.createElement('option');
        option.value = dev.name;
        option.textContent = dev.name;
        select.appendChild(option);
    });
}

function renderBuyers() {
    const tbody = document.getElementById('buyersTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (filteredBuyers.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    tbody.innerHTML = filteredBuyers.map(buyer => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 1rem;">
                <div style="font-weight: 500; color: #1F2937;">${buyer.name}</div>
                ${buyer.additionalBuyer ? '<div style="font-size: 0.75rem; color: #9CA3AF; margin-top: 0.25rem;">Additional Buyer</div>' : ''}
            </td>
            <td style="padding: 1rem;">
                <div style="font-size: 0.875rem; color: #6B7280;">${buyer.email}</div>
                <div style="font-size: 0.875rem; color: #9CA3AF; margin-top: 0.25rem;">${buyer.phone}</div>
            </td>
            <td style="padding: 1rem;">
                <div style="font-weight: 500; color: #1F2937; font-size: 0.875rem;">${buyer.plot}</div>
                <div style="font-size: 0.75rem; color: #9CA3AF; margin-top: 0.25rem;">${buyer.development}</div>
            </td>
            <td style="padding: 1rem;">
                ${getStatusBadge(buyer.status)}
            </td>
            <td style="padding: 1rem;">
                <div style="font-size: 0.875rem; color: #6B7280;">${formatDate(buyer.lastActivity)}</div>
            </td>
            <td style="padding: 1rem;">
                <button class="btn btn-sm btn-secondary" onclick='viewBuyerDetails(${JSON.stringify(buyer).replace(/'/g, "&apos;")})'>
                    View Details
                </button>
            </td>
        </tr>
    `).join('');
}

function getStatusBadge(status) {
    const badges = {
        enquiry: '<span class="badge" style="background-color: #e0e7ff; color: #4338ca;">Enquiry</span>',
        viewing: '<span class="badge" style="background-color: #dbeafe; color: #1e40af;">Viewing Scheduled</span>',
        reserved: '<span class="badge" style="background-color: #fef3c7; color: #92400e;">Reserved</span>',
        exchanged: '<span class="badge" style="background-color: #d1fae5; color: #065f46;">Exchanged</span>',
        completed: '<span class="badge" style="background-color: #e5e7eb; color: #374151;">Completed</span>'
    };
    return badges[status] || '';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function filterBuyers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const developmentFilter = document.getElementById('developmentFilter').value;
    
    filteredBuyers = buyers.filter(buyer => {
        const matchesSearch = !searchTerm || 
            buyer.name.toLowerCase().includes(searchTerm) ||
            buyer.email.toLowerCase().includes(searchTerm) ||
            buyer.phone.toLowerCase().includes(searchTerm);
        
        const matchesStatus = !statusFilter || buyer.status === statusFilter;
        const matchesDevelopment = !developmentFilter || buyer.development === developmentFilter;
        
        return matchesSearch && matchesStatus && matchesDevelopment;
    });
    
    renderBuyers();
}

function viewBuyerDetails(buyer) {
    const modal = document.getElementById('buyerDetailsModal');
    const content = document.getElementById('buyerDetailsContent');
    
    content.innerHTML = `
        <div style="display: grid; gap: 1.5rem;">
            <div>
                <h4 style="font-size: 1rem; font-weight: 600; color: #1F2937; margin-bottom: 1rem;">Personal Information</h4>
                <div style="display: grid; gap: 0.75rem;">
                    <div style="display: grid; grid-template-columns: 150px 1fr; gap: 1rem;">
                        <span style="color: #6B7280; font-size: 0.875rem;">Name:</span>
                        <span style="font-weight: 500; color: #1F2937; font-size: 0.875rem;">${buyer.name}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: 150px 1fr; gap: 1rem;">
                        <span style="color: #6B7280; font-size: 0.875rem;">Email:</span>
                        <span style="font-weight: 500; color: #1F2937; font-size: 0.875rem;">${buyer.email}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: 150px 1fr; gap: 1rem;">
                        <span style="color: #6B7280; font-size: 0.875rem;">Phone:</span>
                        <span style="font-weight: 500; color: #1F2937; font-size: 0.875rem;">${buyer.phone}</span>
                    </div>
                    ${buyer.additionalBuyer ? `
                        <div style="display: grid; grid-template-columns: 150px 1fr; gap: 1rem;">
                            <span style="color: #6B7280; font-size: 0.875rem;">Buyer Type:</span>
                            <span class="badge" style="background-color: #dbeafe; color: #1e40af;">Additional Buyer</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div>
                <h4 style="font-size: 1rem; font-weight: 600; color: #1F2937; margin-bottom: 1rem;">Property Interest</h4>
                <div style="display: grid; gap: 0.75rem;">
                    <div style="display: grid; grid-template-columns: 150px 1fr; gap: 1rem;">
                        <span style="color: #6B7280; font-size: 0.875rem;">Plot:</span>
                        <span style="font-weight: 500; color: #1F2937; font-size: 0.875rem;">${buyer.plot}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: 150px 1fr; gap: 1rem;">
                        <span style="color: #6B7280; font-size: 0.875rem;">Development:</span>
                        <span style="font-weight: 500; color: #1F2937; font-size: 0.875rem;">${buyer.development}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: 150px 1fr; gap: 1rem;">
                        <span style="color: #6B7280; font-size: 0.875rem;">Status:</span>
                        ${getStatusBadge(buyer.status)}
                    </div>
                    <div style="display: grid; grid-template-columns: 150px 1fr; gap: 1rem;">
                        <span style="color: #6B7280; font-size: 0.875rem;">Last Activity:</span>
                        <span style="font-weight: 500; color: #1F2937; font-size: 0.875rem;">${formatDate(buyer.lastActivity)}</span>
                    </div>
                </div>
            </div>
            
            ${buyer.reservationId ? `
                <div style="padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                    <button class="btn btn-primary" onclick="viewReservation('${buyer.reservationId}')">
                        View Reservation Details
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    modal.classList.add('active');
}

function closeBuyerDetailsModal() {
    document.getElementById('buyerDetailsModal').classList.remove('active');
}

function viewReservation(reservationId) {
    window.location.href = `reservations.html?id=${reservationId}`;
}

function exportBuyers() {
    // Create CSV content
    const headers = ['Name', 'Email', 'Phone', 'Plot', 'Development', 'Status', 'Last Activity', 'Buyer Type'];
    const rows = filteredBuyers.map(buyer => [
        buyer.name,
        buyer.email,
        buyer.phone,
        buyer.plot,
        buyer.development,
        buyer.status,
        formatDate(buyer.lastActivity),
        buyer.additionalBuyer ? 'Additional Buyer' : 'Primary Buyer'
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buyers-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}
