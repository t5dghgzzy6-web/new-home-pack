// Analytics Dashboard
let currentPeriod = '30d';

document.addEventListener('DOMContentLoaded', () => {
    loadAnalytics();
    updateUserName();
});

function updateUserName() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.name) {
        document.getElementById('userName').textContent = currentUser.name;
    }
}

function setTimePeriod(period) {
    currentPeriod = period;
    
    // Update button states
    document.querySelectorAll('.btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadAnalytics();
}

function loadAnalytics() {
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    const developments = JSON.parse(localStorage.getItem('developments') || '[]');
    
    // Calculate metrics
    calculateKeyMetrics(reservations);
    renderDevelopmentPerformance(developments);
    renderSalesFunnel(reservations);
    renderTopPlots();
}

function calculateKeyMetrics(reservations) {
    // Total Revenue (from reservation fees)
    const totalRevenue = reservations.reduce((sum, r) => {
        return sum + (parseFloat(r.reservationFee) || 0);
    }, 0);
    
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('revenueChange').textContent = '+12.5%'; // Demo data
    
    // Total Reservations
    document.getElementById('totalReservations').textContent = reservations.length;
    document.getElementById('reservationsChange').textContent = '+8.3%'; // Demo data
    
    // Conversion Rate (mock calculation)
    const pageViews = 450; // This would come from analytics tracking
    const conversionRate = reservations.length > 0 ? ((reservations.length / pageViews) * 100).toFixed(1) : 0;
    document.getElementById('conversionRate').textContent = conversionRate + '%';
    document.getElementById('conversionChange').textContent = '+2.1%'; // Demo data
    
    // Average Time to Reserve (mock)
    document.getElementById('avgTimeToReserve').textContent = '12d';
    document.getElementById('timeChange').textContent = '-15%'; // Demo data (negative is good)
    document.querySelector('#timeChange').classList.add('positive');
}

function renderDevelopmentPerformance(developments) {
    const tbody = document.getElementById('developmentPerformanceTable');
    
    if (developments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding: 2rem; text-align: center; color: #9CA3AF;">No developments found</td></tr>';
        return;
    }
    
    tbody.innerHTML = developments.map(dev => {
        const available = dev.availablePlots || 0;
        const reserved = dev.reservedPlots || 0;
        const sold = dev.soldPlots || 0;
        const total = dev.totalPlots || 0;
        const sellThroughRate = total > 0 ? (((reserved + sold) / total) * 100).toFixed(1) : 0;
        const avgPrice = 500000; // Mock data - would come from actual plot prices
        
        return `
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 0.75rem; font-weight: 500; color: #1F2937;">${dev.name}</td>
                <td style="padding: 0.75rem; color: #6B7280;">${total}</td>
                <td style="padding: 0.75rem; color: #10b981;">${available}</td>
                <td style="padding: 0.75rem; color: #f59e0b;">${reserved}</td>
                <td style="padding: 0.75rem; color: #6B7280;">${sold}</td>
                <td style="padding: 0.75rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
                            <div style="height: 100%; background: #10b981; width: ${sellThroughRate}%;"></div>
                        </div>
                        <span style="font-weight: 500; color: #1F2937; min-width: 45px;">${sellThroughRate}%</span>
                    </div>
                </td>
                <td style="padding: 0.75rem; font-weight: 500; color: #1F2937;">${formatCurrency(avgPrice)}</td>
            </tr>
        `;
    }).join('');
}

function renderSalesFunnel(reservations) {
    // Mock funnel data - in production, this would come from real analytics
    const views = 450;
    const downloads = 125;
    const viewings = 45;
    const reservationCount = reservations.length;
    const exchanges = reservations.filter(r => r.status === 'exchanged' || r.status === 'completed').length;
    
    // Update numbers
    document.getElementById('funnelViews').textContent = views;
    document.getElementById('funnelDownloads').textContent = downloads;
    document.getElementById('funnelViewings').textContent = viewings;
    document.getElementById('funnelReservations').textContent = reservationCount;
    document.getElementById('funnelExchanges').textContent = exchanges;
    
    // Update bar widths (relative to views)
    document.getElementById('funnelViewsBar').style.width = '100%';
    document.getElementById('funnelDownloadsBar').style.width = ((downloads / views) * 100) + '%';
    document.getElementById('funnelViewingsBar').style.width = ((viewings / views) * 100) + '%';
    document.getElementById('funnelReservationsBar').style.width = ((reservationCount / views) * 100) + '%';
    document.getElementById('funnelExchangesBar').style.width = ((exchanges / views) * 100) + '%';
}

function renderTopPlots() {
    const tbody = document.getElementById('topPlotsTable');
    
    // Mock data for top performing plots
    const topPlots = [
        { plot: 'Plot 12', development: 'Riverside Gardens', views: 87, downloads: 34, enquiries: 12, status: 'Reserved' },
        { plot: 'Plot 8', development: 'Parkside View', views: 76, downloads: 28, enquiries: 9, status: 'Available' },
        { plot: 'Plot 15', development: 'Riverside Gardens', views: 65, downloads: 22, enquiries: 8, status: 'Available' },
        { plot: 'Plot 3', development: 'Oakfield Rise', views: 58, downloads: 19, enquiries: 7, status: 'Reserved' },
        { plot: 'Plot 21', development: 'Parkside View', views: 52, downloads: 16, enquiries: 5, status: 'Available' }
    ];
    
    tbody.innerHTML = topPlots.map(plot => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 0.75rem; font-weight: 500; color: #1F2937;">${plot.plot}</td>
            <td style="padding: 0.75rem; color: #6B7280;">${plot.development}</td>
            <td style="padding: 0.75rem; color: #6B7280;">${plot.views}</td>
            <td style="padding: 0.75rem; color: #6B7280;">${plot.downloads}</td>
            <td style="padding: 0.75rem; color: #6B7280;">${plot.enquiries}</td>
            <td style="padding: 0.75rem;">
                ${plot.status === 'Reserved' 
                    ? '<span class="badge" style="background-color: #fef3c7; color: #92400e;">Reserved</span>'
                    : '<span class="badge" style="background-color: #d1fae5; color: #065f46;">Available</span>'
                }
            </td>
        </tr>
    `).join('');
}

function formatCurrency(amount) {
    return '£' + amount.toLocaleString('en-GB', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}
