// Sales Dashboard JavaScript
// CRM and pipeline management for sales team

// Check authentication
checkAuth('sales');

let allLeads = [];
let allReservations = [];
let allContacts = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    loadData();
    updateMetrics();
    loadPipelineBoard();
    loadTodaysTasks();
    loadRecentActivity();
    populateFilters();
    setupCommissionFeatureBtn();
});
// Commission feature placeholder
function setupCommissionFeatureBtn() {
    const btn = document.getElementById('commissionFeatureBtn');
    if (btn) {
        btn.addEventListener('click', function() {
            const msg = document.getElementById('commissionFeatureMsg');
            if (msg) {
                msg.style.display = 'block';
                setTimeout(() => { msg.style.display = 'none'; }, 2500);
            }
        });
    }
}

// Load user information
function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('nhp_user'));
    if (user && user.name) {
        document.getElementById('userName').textContent = user.name;
    }
}

// Load all data
function loadData() {
    // Load leads
    const leadsStr = localStorage.getItem('nhp_leads');
    allLeads = leadsStr ? JSON.parse(leadsStr) : [];
    
    // Load reservations
    allReservations = getAllReservations();
    
    // Load contacts
    const contactsStr = localStorage.getItem('nhp_contacts');
    allContacts = contactsStr ? JSON.parse(contactsStr) : [];
    
    // Initialize demo data if empty
    if (allLeads.length === 0) {
        initializeDemoData();
    }
}

// Initialize demo data
function initializeDemoData() {
    const demoLeads = [
        {
            id: 'LEAD-' + Date.now(),
            name: 'John Smith',
            email: 'john.smith@email.com',
            phone: '07700 900123',
            status: 'new',
            source: 'website',
            plotInterest: '12',
            development: 'Riverside Gardens',
            budget: 425000,
            notes: 'Interested in 2-bed apartment with balcony',
            createdDate: Date.now() - (3 * 24 * 60 * 60 * 1000), // 3 days ago
            lastContact: Date.now() - (1 * 24 * 60 * 60 * 1000),
            nextFollowUp: Date.now() + (2 * 24 * 60 * 60 * 1000),
            assignedTo: 'sales@newhomepack.com'
        },
        {
            id: 'LEAD-' + (Date.now() + 1),
            name: 'Sarah Johnson',
            email: 'sarah.j@email.com',
            phone: '07700 900456',
            status: 'viewing_scheduled',
            source: 'referral',
            plotInterest: '8',
            development: 'Riverside Gardens',
            budget: 385000,
            viewingDate: Date.now() + (1 * 24 * 60 * 60 * 1000), // Tomorrow
            notes: 'First time buyer, needs help with solicitor',
            createdDate: Date.now() - (7 * 24 * 60 * 60 * 1000),
            lastContact: Date.now(),
            assignedTo: 'sales@newhomepack.com'
        }
    ];
    
    localStorage.setItem('nhp_leads', JSON.stringify(demoLeads));
    allLeads = demoLeads;
}

// Update metrics
function updateMetrics() {
    const now = Date.now();
    const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const monthAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    // Active leads
    const activeLeads = allLeads.filter(l => l.status !== 'lost' && l.status !== 'converted').length;
    document.getElementById('activeLeads').textContent = activeLeads;
    
    // New leads this week
    const newLeadsWeek = allLeads.filter(l => l.createdDate >= weekAgo).length;
    document.getElementById('newLeadsWeek').textContent = newLeadsWeek;
    
    // Viewings scheduled
    const viewings = allLeads.filter(l => l.status === 'viewing_scheduled' || l.viewingDate).length;
    document.getElementById('viewingsScheduled').textContent = viewings;
    
    // Viewings this week
    const viewingsWeek = allLeads.filter(l => 
        l.viewingDate && l.viewingDate >= now && l.viewingDate <= now + (7 * 24 * 60 * 60 * 1000)
    ).length;
    document.getElementById('viewingsWeek').textContent = viewingsWeek;
    
    // Reservations
    const reservations = allReservations.length;
    document.getElementById('reservationsCount').textContent = reservations;
    
    // Reservations this month
    const reservationsMonth = allReservations.filter(r => r.reservationDate >= monthAgo).length;
    document.getElementById('reservationsMonth').textContent = reservationsMonth;
    
    // Exchanges
    const exchanges = allReservations.filter(r => r.exchangeDate).length;
    document.getElementById('exchangesCount').textContent = exchanges;
    
    // Exchanges this month
    const exchangesMonth = allReservations.filter(r => 
        r.exchangeDate && r.exchangeDate >= monthAgo
    ).length;
    document.getElementById('exchangesMonth').textContent = exchangesMonth;
    
    // Commission (estimated at 1% of property value)
    const commissionMonth = allReservations
        .filter(r => r.reservationDate >= monthAgo)
        .reduce((sum, r) => sum + (parseFloat(r.price) || 0), 0) * 0.01;
    document.getElementById('commissionMonth').textContent = 
        '£' + Math.round(commissionMonth).toLocaleString();
    
    // Conversion rate
    const totalLeads = allLeads.length;
    const convertedLeads = allLeads.filter(l => l.status === 'converted').length + reservations;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
    document.getElementById('conversionRate').textContent = conversionRate + '%';
}

// Load pipeline board
function loadPipelineBoard() {
    const container = document.getElementById('pipelineBoard');
    
    // Pipeline stages
    const stages = [
        { id: 'new', name: 'New Leads', color: '#3B82F6', icon: '👤' },
        { id: 'contacted', name: 'Contacted', color: '#8B5CF6', icon: '📞' },
        { id: 'viewing_scheduled', name: 'Viewing Scheduled', color: '#F59E0B', icon: '📅' },
        { id: 'offer_made', name: 'Offer Made', color: '#10B981', icon: '💰' },
        { id: 'reserved', name: 'Reserved', color: '#DC2626', icon: '🏠' }
    ];
    
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; padding: 1.5rem;">';
    
    stages.forEach(stage => {
        const stageLeads = allLeads.filter(l => l.status === stage.id);
        const stageReservations = stage.id === 'reserved' ? allReservations.filter(r => !r.exchangeDate) : [];
        const totalCount = stageLeads.length + stageReservations.length;
        
        html += `
            <div style="background: #F9FAFB; border-radius: 0.75rem; padding: 1rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.5rem;">${stage.icon}</span>
                        <h3 style="font-size: 1rem; font-weight: 600; margin: 0;">${stage.name}</h3>
                    </div>
                    <span style="background: ${stage.color}; color: white; padding: 0.25rem 0.5rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 700;">
                        ${totalCount}
                    </span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        `;
        
        // Show leads
        stageLeads.slice(0, 3).forEach(lead => {
            const daysOld = Math.floor((Date.now() - lead.createdDate) / (1000 * 60 * 60 * 24));
            html += `
                <div onclick="viewLead('${lead.id}')" style="background: white; border: 1px solid #E5E7EB; border-radius: 0.5rem; padding: 0.75rem; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='${stage.color}'" onmouseout="this.style.borderColor='#E5E7EB'">
                    <div style="font-weight: 600; margin-bottom: 0.25rem;">${lead.name}</div>
                    <div style="font-size: 0.75rem; color: #6B7280;">
                        ${lead.development || 'No development'} - Plot ${lead.plotInterest || 'TBC'}
                    </div>
                    <div style="font-size: 0.75rem; color: #9CA3AF; margin-top: 0.25rem;">
                        ${daysOld} days in pipeline
                    </div>
                </div>
            `;
        });
        
        // Show reservations in reserved stage
        if (stage.id === 'reserved') {
            stageReservations.slice(0, 3).forEach(res => {
                const daysUntilExchange = Math.ceil((new Date(res.reservationDate).getTime() + (28 * 24 * 60 * 60 * 1000) - Date.now()) / (1000 * 60 * 60 * 24));
                html += `
                    <div onclick="viewReservation('${res.id}')" style="background: white; border: 1px solid #E5E7EB; border-radius: 0.5rem; padding: 0.75rem; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='${stage.color}'" onmouseout="this.style.borderColor='#E5E7EB'">
                        <div style="font-weight: 600; margin-bottom: 0.25rem;">${res.buyerName}</div>
                        <div style="font-size: 0.75rem; color: #6B7280;">
                            Plot ${res.plotNumber} - £${parseFloat(res.price).toLocaleString()}
                        </div>
                        <div style="font-size: 0.75rem; color: ${daysUntilExchange <= 7 ? '#DC2626' : '#10B981'}; margin-top: 0.25rem;">
                            ${daysUntilExchange} days to exchange
                        </div>
                    </div>
                `;
            });
        }
        
        if (totalCount > 3) {
            html += `
                <div style="text-align: center; padding: 0.5rem; color: #6B7280; font-size: 0.875rem;">
                    + ${totalCount - 3} more
                </div>
            `;
        }
        
        if (totalCount === 0) {
            html += `
                <div style="text-align: center; padding: 2rem; color: #9CA3AF; font-size: 0.875rem;">
                    No ${stage.name.toLowerCase()}
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
}

// Load today's tasks
function loadTodaysTasks() {
    const container = document.getElementById('todaysTasks');
    const today = new Date().setHours(0, 0, 0, 0);
    const tomorrow = today + (24 * 60 * 60 * 1000);
    
    const tasks = [];
    
    // Follow-up tasks
    allLeads.forEach(lead => {
        if (lead.nextFollowUp && lead.nextFollowUp >= today && lead.nextFollowUp < tomorrow) {
            tasks.push({
                type: 'follow_up',
                priority: 'high',
                title: `Follow up with ${lead.name}`,
                description: `${lead.development || 'Development'} - Plot ${lead.plotInterest || 'TBC'}`,
                action: `viewLead('${lead.id}')`,
                time: lead.nextFollowUp
            });
        }

        // Offer approval required
        if (lead.status === 'offer_made' && lead.offerDate && lead.offerDate >= today && lead.offerDate < tomorrow) {
            tasks.push({
                type: 'offer_approval',
                priority: 'critical',
                title: `Approve offer for ${lead.name}`,
                description: `${lead.development || 'Development'} - Plot ${lead.plotInterest || 'TBC'}`,
                action: `viewLead('${lead.id}')`,
                time: lead.offerDate
            });
        }

        // Source of funds request
        if (lead.status === 'offer_approved' && lead.sourceOfFundsRequested && lead.sourceOfFundsRequested >= today && lead.sourceOfFundsRequested < tomorrow) {
            tasks.push({
                type: 'source_of_funds',
                priority: 'high',
                title: `Request source of funds from ${lead.name}`,
                description: `${lead.development || 'Development'} - Plot ${lead.plotInterest || 'TBC'}`,
                action: `viewLead('${lead.id}')`,
                time: lead.sourceOfFundsRequested
            });
        }

        // DIP request
        if (lead.status === 'offer_approved' && lead.dipRequested && lead.dipRequested >= today && lead.dipRequested < tomorrow) {
            tasks.push({
                type: 'dip_request',
                priority: 'high',
                title: `Request DIP from ${lead.name}`,
                description: `${lead.development || 'Development'} - Plot ${lead.plotInterest || 'TBC'}`,
                action: `viewLead('${lead.id}')`,
                time: lead.dipRequested
            });
        }

        // Reservation form signing
        if (lead.status === 'dip_received' && lead.reservationFormDue && lead.reservationFormDue >= today && lead.reservationFormDue < tomorrow) {
            tasks.push({
                type: 'reservation_form',
                priority: 'high',
                title: `Send reservation form to ${lead.name}`,
                description: `${lead.development || 'Development'} - Plot ${lead.plotInterest || 'TBC'}`,
                action: `viewLead('${lead.id}')`,
                time: lead.reservationFormDue
            });
        }

        // Legal checks
        if (lead.status === 'reserved' && lead.legalCheckDue && lead.legalCheckDue >= today && lead.legalCheckDue < tomorrow) {
            tasks.push({
                type: 'legal_check',
                priority: 'high',
                title: `Legal check for ${lead.name}`,
                description: `${lead.development || 'Development'} - Plot ${lead.plotInterest || 'TBC'}`,
                action: `viewLead('${lead.id}')`,
                time: lead.legalCheckDue
            });
        }
    });

    // Viewings today
    allLeads.forEach(lead => {
        if (lead.viewingDate && lead.viewingDate >= today && lead.viewingDate < tomorrow) {
            tasks.push({
                type: 'viewing',
                priority: 'high',
                title: `Viewing with ${lead.name}`,
                description: `${lead.development || 'Development'} - Plot ${lead.plotInterest || 'TBC'}`,
                action: `viewLead('${lead.id}')`,
                time: lead.viewingDate
            });
        }
    });

    // Exchange deadlines (within 7 days)
    allReservations.forEach(res => {
        if (!res.exchangeDate) {
            const reservationDate = new Date(res.reservationDate);
            const exchangeDeadline = new Date(reservationDate);
            exchangeDeadline.setDate(exchangeDeadline.getDate() + 28);
            const daysRemaining = Math.ceil((exchangeDeadline - Date.now()) / (1000 * 60 * 60 * 24));
            
            if (daysRemaining <= 7) {
                tasks.push({
                    type: 'exchange_deadline',
                    priority: daysRemaining <= 3 ? 'critical' : 'high',
                    title: `Exchange deadline approaching - ${res.buyerName}`,
                    description: `Plot ${res.plotNumber} - ${daysRemaining} days remaining`,
                    action: `viewReservation('${res.id}')`,
                    time: exchangeDeadline.getTime()
                });
            }
        }
    });
    
    // Sort by priority and time
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    tasks.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.time - b.time;
    });
    
    document.getElementById('taskCount').textContent = `${tasks.length} tasks`;
    
    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <h3 class="empty-state-title">All Clear!</h3>
                <p class="empty-state-text">No tasks scheduled for today.</p>
            </div>
        `;
        return;
    }
    
    let html = '<div style="padding: 1.5rem;">';
    
    tasks.forEach(task => {
        let priorityColor = '';
        let priorityLabel = '';
        let icon = '';
        
        switch (task.priority) {
            case 'critical':
                priorityColor = '#DC2626';
                priorityLabel = '🔴 CRITICAL';
                break;
            case 'high':
                priorityColor = '#F59E0B';
                priorityLabel = '🟠 HIGH';
                break;
            case 'medium':
                priorityColor = '#3B82F6';
                priorityLabel = '🔵 MEDIUM';
                break;
            default:
                priorityColor = '#6B7280';
                priorityLabel = '⚪ LOW';
        }
        
        switch (task.type) {
            case 'follow_up':
                icon = '📞';
                break;
            case 'viewing':
                icon = '📅';
                break;
            case 'exchange_deadline':
                icon = '⏰';
                break;
            default:
                icon = '📋';
        }
        
        const timeDisplay = new Date(task.time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        
        html += `
            <div style="border-left: 4px solid ${priorityColor}; padding: 1rem; margin-bottom: 1rem; background: #F9FAFB; border-radius: 0 0.5rem 0.5rem 0; cursor: pointer;" onclick="${task.action}">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <span style="font-size: 1.25rem;">${icon}</span>
                            <span style="font-size: 0.75rem; font-weight: 700; color: ${priorityColor}; letter-spacing: 0.05em;">${priorityLabel}</span>
                            <span style="font-size: 0.875rem; color: #6B7280;">${timeDisplay}</span>
                        </div>
                        <h4 style="font-size: 1rem; font-weight: 600; margin: 0 0 0.25rem 0;">${task.title}</h4>
                        <p style="color: #6B7280; font-size: 0.875rem; margin: 0;">${task.description}</p>
                    </div>
                    <button class="btn btn-primary btn-small">View</button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
}

// Load recent activity
function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    
    const activity = [];
    
    // Recent leads
    allLeads.slice().sort((a, b) => b.createdDate - a.createdDate).slice(0, 3).forEach(lead => {
        activity.push({
            icon: '👤',
            title: 'New lead added',
            description: `${lead.name} - ${lead.development || 'Development'}`,
            time: lead.createdDate,
            color: '#3B82F6'
        });
    });
    
    // Recent reservations
    allReservations.slice().sort((a, b) => b.reservationDate - a.reservationDate).slice(0, 3).forEach(res => {
        activity.push({
            icon: '🏠',
            title: 'Reservation confirmed',
            description: `${res.buyerName} - Plot ${res.plotNumber}`,
            time: res.reservationDate,
            color: '#DC2626'
        });
    });
    
    // Recent exchanges
    allReservations.filter(r => r.exchangeDate).sort((a, b) => b.exchangeDate - a.exchangeDate).slice(0, 2).forEach(res => {
        activity.push({
            icon: '🎉',
            title: 'Exchange completed',
            description: `${res.buyerName} - Plot ${res.plotNumber}`,
            time: res.exchangeDate,
            color: '#10B981'
        });
    });
    
    // Sort by time
    activity.sort((a, b) => b.time - a.time);
    
    if (activity.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <h3 class="empty-state-title">No Activity Yet</h3>
                <p class="empty-state-text">Activity will appear here as you work.</p>
            </div>
        `;
        return;
    }
    
    let html = '<div style="padding: 1.5rem;">';
    
    activity.slice(0, 10).forEach(item => {
        const timeAgo = getTimeAgo(item.time);
        
        html += `
            <div style="display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid #E5E7EB;">
                <div style="width: 2.5rem; height: 2.5rem; background: ${item.color}20; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                    ${item.icon}
                </div>
                <div style="flex: 1;">
                    <h4 style="font-size: 0.875rem; font-weight: 600; margin: 0 0 0.25rem 0;">${item.title}</h4>
                    <p style="font-size: 0.875rem; color: #6B7280; margin: 0;">${item.description}</p>
                    <p style="font-size: 0.75rem; color: #9CA3AF; margin: 0.25rem 0 0 0;">${timeAgo}</p>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
}

// Helper functions
function getAllReservations() {
    const reservations = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('nhp_reservation_')) {
            const reservation = JSON.parse(localStorage.getItem(key));
            reservations.push(reservation);
        }
    }
    return reservations;
}

function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago';
    return new Date(timestamp).toLocaleDateString();
}

function populateFilters() {
    // Populate development filter
    const developments = [...new Set(allLeads.map(l => l.development).filter(d => d))];
    const select = document.getElementById('pipelineFilter');
    
    developments.forEach(dev => {
        const option = document.createElement('option');
        option.value = dev;
        option.textContent = dev;
        select.appendChild(option);
    });
}

function filterPipeline() {
    // Filter functionality (reload pipeline with filter)
    loadPipelineBoard();
}

// Action handlers
function addNewLead() {
    window.location.href = 'leads.html?action=new';
}

function viewLead(leadId) {
    window.location.href = `lead-details.html?id=${leadId}`;
}

function viewReservation(reservationId) {
    window.location.href = `../buyer/reservation-details.html?id=${reservationId}`;
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#DC2626' : '#3B82F6'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
