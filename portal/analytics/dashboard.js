// Advanced Analytics Dashboard JavaScript

let currentTimeRange = '30d';
let revenueChart, performanceChart, sourceChart;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Loading analytics dashboard...');
    loadAnalytics();
    initializeCharts();
    
    // Refresh every 60 seconds
    setInterval(loadAnalytics, 60000);
});

// Load and calculate analytics
function loadAnalytics() {
    const data = gatherData();
    updateMetrics(data);
    updateKPIs(data);
    updateFunnel(data);
    updateCharts(data);
}

// Gather all data from localStorage
function gatherData() {
    const reservations = [];
    const leads = [];
    
    // Get all reservations
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('nhp_reservation_')) {
            const reservation = JSON.parse(localStorage.getItem(key));
            reservations.push(reservation);
        }
    }
    
    // Get all leads
    const leadsStr = localStorage.getItem('nhp_leads');
    if (leadsStr) {
        leads.push(...JSON.parse(leadsStr));
    }
    
    return { reservations, leads };
}

// Update main metrics
function updateMetrics(data) {
    const { reservations, leads } = data;
    
    // Total Revenue (from exchanged properties)
    const exchanged = reservations.filter(r => r.exchangeDate);
    const totalRevenue = exchanged.reduce((sum, r) => sum + (parseFloat(r.price) || 0), 0);
    document.getElementById('totalRevenue').textContent = `£${(totalRevenue / 1000).toFixed(0)}K`;
    document.getElementById('revenueCount').textContent = exchanged.length;
    
    // Conversion Rate
    const converted = leads.filter(l => l.status === 'converted').length;
    const conversionRate = leads.length > 0 ? (converted / leads.length * 100) : 0;
    document.getElementById('conversionRate').textContent = `${conversionRate.toFixed(1)}%`;
    
    // Average Days to Exchange
    let totalDays = 0;
    let count = 0;
    exchanged.forEach(r => {
        if (r.exchangeDate && r.reservationDate) {
            const days = Math.ceil((r.exchangeDate - r.reservationDate) / (1000 * 60 * 60 * 24));
            totalDays += days;
            count++;
        }
    });
    const avgDays = count > 0 ? Math.round(totalDays / count) : 0;
    document.getElementById('avgDays').textContent = avgDays;
    
    // Pipeline Value (active reservations)
    const active = reservations.filter(r => !r.exchangeDate);
    const pipelineValue = active.reduce((sum, r) => sum + (parseFloat(r.price) || 0), 0);
    document.getElementById('pipelineValue').textContent = `£${(pipelineValue / 1000000).toFixed(2)}M`;
    document.getElementById('pipelineCount').textContent = active.length;
}

// Update KPI cards
function updateKPIs(data) {
    const { reservations, leads } = data;
    
    // Monthly Target
    const monthlyTarget = 500000; // £500K
    const thisMonth = reservations.filter(r => {
        if (!r.exchangeDate) return false;
        const date = new Date(r.exchangeDate);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
    const monthlyRevenue = thisMonth.reduce((sum, r) => sum + (parseFloat(r.price) || 0), 0);
    const monthlyPercent = (monthlyRevenue / monthlyTarget * 100).toFixed(1);
    document.getElementById('monthlyProgress').style.width = `${Math.min(monthlyPercent, 100)}%`;
    document.getElementById('monthlyPercent').textContent = monthlyPercent;
    
    // Average Property Value
    if (reservations.length > 0) {
        const totalValue = reservations.reduce((sum, r) => sum + (parseFloat(r.price) || 0), 0);
        const avgValue = totalValue / reservations.length;
        document.getElementById('avgPropertyValue').textContent = `£${(avgValue / 1000).toFixed(0)}K`;
    }
    
    // Completion Rate
    const completed = reservations.filter(r => r.exchangeDate && r.completionDate).length;
    const completionRate = reservations.length > 0 ? (completed / reservations.length * 100) : 0;
    document.getElementById('completionRate').textContent = `${completionRate.toFixed(1)}%`;
    document.getElementById('completionProgress').style.width = `${completionRate}%`;
}

// Update conversion funnel
function updateFunnel(data) {
    const { reservations, leads } = data;
    
    const funnelData = [
        {
            name: 'Leads Generated',
            count: leads.length,
            color: '#DC2626'
        },
        {
            name: 'Contacted',
            count: leads.filter(l => ['contacted', 'viewing_scheduled', 'offer_made', 'converted'].includes(l.status)).length,
            color: '#EF4444'
        },
        {
            name: 'Viewings Scheduled',
            count: leads.filter(l => ['viewing_scheduled', 'offer_made', 'converted'].includes(l.status)).length,
            color: '#F87171'
        },
        {
            name: 'Offers Made',
            count: leads.filter(l => ['offer_made', 'converted'].includes(l.status)).length,
            color: '#FCA5A5'
        },
        {
            name: 'Reservations',
            count: reservations.length,
            color: '#FECACA'
        },
        {
            name: 'Exchanged',
            count: reservations.filter(r => r.exchangeDate).length,
            color: '#FEE2E2'
        }
    ];
    
    const maxCount = funnelData[0].count || 1;
    const container = document.getElementById('conversionFunnel');
    
    let html = '';
    funnelData.forEach((stage, index) => {
        const width = (stage.count / maxCount * 100);
        const conversion = index > 0 ? ((stage.count / funnelData[index - 1].count) * 100).toFixed(1) : 100;
        
        html += `
            <div class="funnel-stage">
                <div class="funnel-info">
                    <div class="funnel-stage-name">${stage.name}</div>
                    <div class="funnel-stats">
                        <span><strong>${stage.count}</strong> total</span>
                        ${index > 0 ? `<span>${conversion}% conversion</span>` : ''}
                    </div>
                </div>
                <div class="funnel-bar" style="width: ${width}%; background: ${stage.color};">
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Initialize charts
function initializeCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    revenueChart = new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Actual Revenue',
                data: [],
                borderColor: '#DC2626',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'Forecast',
                data: [],
                borderColor: '#FF6B35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                borderDash: [5, 5],
                fill: false,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '£' + (value / 1000) + 'K';
                        }
                    }
                }
            }
        }
    });
    
    // Performance Chart
    const perfCtx = document.getElementById('performanceChart').getContext('2d');
    performanceChart = new Chart(perfCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'New Leads',
                data: [],
                backgroundColor: '#60A5FA',
            }, {
                label: 'Viewings',
                data: [],
                backgroundColor: '#34D399',
            }, {
                label: 'Reservations',
                data: [],
                backgroundColor: '#DC2626',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Source Chart
    const sourceCtx = document.getElementById('sourceChart').getContext('2d');
    sourceChart = new Chart(sourceCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#DC2626',
                    '#EF4444',
                    '#F87171',
                    '#FCA5A5',
                    '#FECACA',
                    '#FEE2E2'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'right'
                }
            }
        }
    });
}

// Update charts with data
function updateCharts(data) {
    const { reservations, leads } = data;
    
    // Revenue Chart - Last 6 months
    const months = [];
    const revenueData = [];
    const forecastData = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }));
        
        const monthRevenue = reservations.filter(r => {
            if (!r.exchangeDate) return false;
            const exDate = new Date(r.exchangeDate);
            return exDate.getMonth() === date.getMonth() && exDate.getFullYear() === date.getFullYear();
        }).reduce((sum, r) => sum + (parseFloat(r.price) || 0), 0);
        
        revenueData.push(monthRevenue);
    }
    
    // Simple forecast - average of last 3 months + 10%
    const avgRevenue = revenueData.slice(-3).reduce((a, b) => a + b, 0) / 3;
    for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() + i + 1);
        months.push(date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }));
        forecastData.push(avgRevenue * 1.1);
    }
    
    revenueChart.data.labels = months;
    revenueChart.data.datasets[0].data = [...revenueData, null, null, null];
    revenueChart.data.datasets[1].data = [...Array(6).fill(null), ...forecastData];
    revenueChart.update();
    
    // Performance Chart - Last 4 weeks
    const weeks = [];
    const newLeadsData = [];
    const viewingsData = [];
    const reservationsData = [];
    
    for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        weeks.push(`Week ${4 - i}`);
        
        const weekLeads = leads.filter(l => {
            const created = new Date(l.created);
            return created >= weekStart && created < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        }).length;
        
        newLeadsData.push(weekLeads);
        viewingsData.push(Math.floor(weekLeads * 0.6)); // Assume 60% get viewings
        reservationsData.push(Math.floor(weekLeads * 0.2)); // Assume 20% convert
    }
    
    performanceChart.data.labels = weeks;
    performanceChart.data.datasets[0].data = newLeadsData;
    performanceChart.data.datasets[1].data = viewingsData;
    performanceChart.data.datasets[2].data = reservationsData;
    performanceChart.update();
    
    // Source Chart
    const sources = {};
    leads.forEach(lead => {
        const source = lead.source || 'Unknown';
        sources[source] = (sources[source] || 0) + 1;
    });
    
    sourceChart.data.labels = Object.keys(sources);
    sourceChart.data.datasets[0].data = Object.values(sources);
    sourceChart.update();
}

// Time range filter
function setTimeRange(range) {
    currentTimeRange = range;
    
    // Update active button
    document.querySelectorAll('.time-filter button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Reload analytics with new range
    loadAnalytics();
}

// Export for console
window.loadAnalytics = loadAnalytics;
window.setTimeRange = setTimeRange;
