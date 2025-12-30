// Load today's tasks for solicitor
function loadSolicitorTodaysTasks() {
    const container = document.getElementById('solicitorTodaysTasks');
    const today = new Date().setHours(0, 0, 0, 0);
    const tomorrow = today + (24 * 60 * 60 * 1000);
    const user = JSON.parse(localStorage.getItem('nhp_user'));
    const allReservations = getAllReservations();
    const myCases = allReservations.filter(r => r.solicitorEmail === user.email);
    const enquiries = getEnquiries();
    const documents = getLegalDocuments();
    const tasks = [];

    // Exchange deadlines (within 7 days)
    myCases.forEach(caseData => {
        if (!caseData.exchangeDate) {
            const reservationDate = new Date(caseData.reservationDate);
            const exchangeDeadline = new Date(reservationDate);
            exchangeDeadline.setDate(exchangeDeadline.getDate() + 28);
            const daysRemaining = Math.ceil((exchangeDeadline - Date.now()) / (1000 * 60 * 60 * 24));
            if (daysRemaining <= 7 && exchangeDeadline >= today && exchangeDeadline < tomorrow) {
                tasks.push({
                    type: 'exchange_deadline',
                    priority: daysRemaining <= 3 ? 'critical' : 'high',
                    title: `Exchange deadline approaching - Plot ${caseData.plotNumber}`,
                    description: `${caseData.buyerName} - ${caseData.developmentName || 'Development'} (${daysRemaining} days remaining)`,
                    action: `viewCase('${caseData.id}')`,
                    time: exchangeDeadline.getTime()
                });
            }
        }
    });

    // Unanswered enquiries (older than 2 days)
    const myEnquiries = enquiries.filter(e => e.solicitorEmail === user.email && e.status === 'pending');
    myEnquiries.forEach(enquiry => {
        const enquiryDate = new Date(enquiry.date);
        const daysSince = Math.ceil((Date.now() - enquiryDate) / (1000 * 60 * 60 * 24));
        if (daysSince >= 2 && enquiryDate >= today && enquiryDate < tomorrow) {
            tasks.push({
                type: 'enquiry',
                priority: daysSince >= 5 ? 'high' : 'medium',
                title: `Unanswered enquiry - ${daysSince} days old`,
                description: `Plot ${enquiry.plotNumber} - ${enquiry.subject}`,
                action: `viewEnquiry('${enquiry.id}')`,
                time: enquiryDate.getTime()
            });
        }
    });

    // Missing documents (searches, lease, transfer)
    myCases.forEach(caseData => {
        const caseDocuments = documents.filter(d => d.plotNumber === caseData.plotNumber);
        const requiredDocTypes = ['searches', 'lease', 'transfer'];
        requiredDocTypes.forEach(docType => {
            const hasDoc = caseDocuments.some(d => d.category === docType);
            if (!hasDoc && caseData.reservationDate) {
                const resDate = new Date(caseData.reservationDate);
                if (resDate >= today && resDate < tomorrow) {
                    tasks.push({
                        type: 'document',
                        priority: 'medium',
                        title: `Missing ${docType} for Plot ${caseData.plotNumber}`,
                        description: `${caseData.buyerName} - Required for conveyancing`,
                        action: `requestDocument('${caseData.plotNumber}', '${docType}')`,
                        time: resDate.getTime()
                    });
                }
            }
        });
    });

    // Sort by priority and time
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    tasks.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.time - b.time;
    });

    document.getElementById('solicitorTaskCount').textContent = `${tasks.length} tasks`;

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
            case 'exchange_deadline':
                icon = '⏰';
                break;
            case 'enquiry':
                icon = '📋';
                break;
            case 'document':
                icon = '📄';
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
// Solicitor Dashboard JavaScript
// Initialize dashboard data and populate UI

// Check authentication
checkAuth('solicitor');

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    loadDashboardStats();
    loadRecentCases();
    loadUrgentActions();
});

// Load user information
function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('nhp_user'));
    if (user && user.name) {
        document.getElementById('userName').textContent = user.name;
    }
}

// Load dashboard statistics
function loadDashboardStats() {
    // Get all cases assigned to this solicitor
    const user = JSON.parse(localStorage.getItem('nhp_user'));
    const allReservations = getAllReservations();
    
    // Filter cases for this solicitor
    const myCases = allReservations.filter(r => r.solicitorEmail === user.email);
    
    // Calculate stats
    const activeCases = myCases.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length;
    const awaitingExchange = myCases.filter(r => r.status === 'reserved' && !r.exchangeDate).length;
    
    // Get pending enquiries
    const enquiries = getEnquiries();
    const pendingEnquiries = enquiries.filter(e => 
        e.solicitorEmail === user.email && e.status === 'pending'
    ).length;
    
    // Get documents
    const documents = getLegalDocuments();
    const documentsReceived = documents.filter(d => 
        myCases.some(c => c.plotNumber === d.plotNumber)
    ).length;
    
    // Update UI
    document.getElementById('activeCases').textContent = activeCases;
    document.getElementById('pendingEnquiries').textContent = pendingEnquiries;
    document.getElementById('awaitingExchange').textContent = awaitingExchange;
    document.getElementById('documentsReceived').textContent = documentsReceived;
}

// Load recent cases
function loadRecentCases() {
    const user = JSON.parse(localStorage.getItem('nhp_user'));
    const allReservations = getAllReservations();
    
    // Filter and sort cases
    const myCases = allReservations
        .filter(r => r.solicitorEmail === user.email)
        .sort((a, b) => b.reservationDate - a.reservationDate)
        .slice(0, 5);
    
    const container = document.getElementById('recentCases');
    
    if (myCases.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚖️</div>
                <h3 class="empty-state-title">No Cases Assigned</h3>
                <p class="empty-state-text">Cases will appear here when buyers select you as their solicitor.</p>
            </div>
        `;
        return;
    }
    
    // Build table
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Plot</th>
                    <th>Development</th>
                    <th>Buyer</th>
                    <th>Status</th>
                    <th>Reserved</th>
                    <th>Exchange Deadline</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    myCases.forEach(caseData => {
        const reservationDate = new Date(caseData.reservationDate);
        const exchangeDeadline = new Date(reservationDate);
        exchangeDeadline.setDate(exchangeDeadline.getDate() + 28);
        
        const daysRemaining = Math.ceil((exchangeDeadline - new Date()) / (1000 * 60 * 60 * 24));
        
        let statusBadge = '';
        if (caseData.exchangeDate) {
            statusBadge = '<span class="status-badge status-completed">Exchanged</span>';
        } else if (daysRemaining <= 7) {
            statusBadge = '<span class="status-badge status-urgent">Urgent</span>';
        } else if (daysRemaining <= 14) {
            statusBadge = '<span class="status-badge status-pending">Active</span>';
        } else {
            statusBadge = '<span class="status-badge status-active">On Track</span>';
        }
        
        let deadlineDisplay = '';
        if (caseData.exchangeDate) {
            deadlineDisplay = `<span style="color: #10B981; font-weight: 600;">✓ ${new Date(caseData.exchangeDate).toLocaleDateString()}</span>`;
        } else {
            const color = daysRemaining <= 7 ? '#DC2626' : daysRemaining <= 14 ? '#F59E0B' : '#6B7280';
            deadlineDisplay = `<span style="color: ${color}; font-weight: 600;">${daysRemaining} days</span>`;
        }
        
        html += `
            <tr>
                <td><strong>Plot ${caseData.plotNumber}</strong></td>
                <td>${caseData.developmentName || 'N/A'}</td>
                <td>${caseData.buyerName}</td>
                <td>${statusBadge}</td>
                <td>${reservationDate.toLocaleDateString()}</td>
                <td>${deadlineDisplay}</td>
                <td>
                    <button class="btn-icon" onclick="viewCase('${caseData.id}')" title="View case">
                        👁️
                    </button>
                    <button class="btn-icon" onclick="viewDocuments('${caseData.plotNumber}')" title="View documents">
                        📄
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Load urgent actions
function loadUrgentActions() {
    const user = JSON.parse(localStorage.getItem('nhp_user'));
    const allReservations = getAllReservations();
    const myCases = allReservations.filter(r => r.solicitorEmail === user.email);
    
    const urgentActions = [];
    
    // Check for urgent exchanges (7 days or less)
    myCases.forEach(caseData => {
        if (!caseData.exchangeDate) {
            const reservationDate = new Date(caseData.reservationDate);
            const exchangeDeadline = new Date(reservationDate);
            exchangeDeadline.setDate(exchangeDeadline.getDate() + 28);
            
            const daysRemaining = Math.ceil((exchangeDeadline - new Date()) / (1000 * 60 * 60 * 24));
            
            if (daysRemaining <= 7) {
                urgentActions.push({
                    type: 'exchange',
                    priority: daysRemaining <= 3 ? 'critical' : 'high',
                    title: `Plot ${caseData.plotNumber} - Exchange deadline in ${daysRemaining} days`,
                    description: `${caseData.buyerName} - ${caseData.developmentName || 'Development'}`,
                    action: `viewCase('${caseData.id}')`,
                    date: exchangeDeadline
                });
            }
        }
    });
    
    // Check for unanswered enquiries
    const enquiries = getEnquiries();
    const myEnquiries = enquiries.filter(e => 
        e.solicitorEmail === user.email && e.status === 'pending'
    );
    
    myEnquiries.forEach(enquiry => {
        const enquiryDate = new Date(enquiry.date);
        const daysSince = Math.ceil((new Date() - enquiryDate) / (1000 * 60 * 60 * 24));
        
        if (daysSince >= 2) {
            urgentActions.push({
                type: 'enquiry',
                priority: daysSince >= 5 ? 'high' : 'medium',
                title: `Unanswered enquiry - ${daysSince} days old`,
                description: `Plot ${enquiry.plotNumber} - ${enquiry.subject}`,
                action: `viewEnquiry('${enquiry.id}')`,
                date: enquiryDate
            });
        }
    });
    
    // Check for missing documents
    const documents = getLegalDocuments();
    myCases.forEach(caseData => {
        const caseDocuments = documents.filter(d => d.plotNumber === caseData.plotNumber);
        const requiredDocTypes = ['searches', 'lease', 'transfer'];
        
        requiredDocTypes.forEach(docType => {
            const hasDoc = caseDocuments.some(d => d.category === docType);
            if (!hasDoc) {
                urgentActions.push({
                    type: 'document',
                    priority: 'medium',
                    title: `Missing ${docType} for Plot ${caseData.plotNumber}`,
                    description: `${caseData.buyerName} - Required for conveyancing`,
                    action: `requestDocument('${caseData.plotNumber}', '${docType}')`,
                    date: new Date(caseData.reservationDate)
                });
            }
        });
    });
    
    // Sort by priority and date
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    urgentActions.sort((a, b) => {
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.date - b.date;
    });
    
    const container = document.getElementById('urgentActions');
    
    if (urgentActions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <h3 class="empty-state-title">All Caught Up!</h3>
                <p class="empty-state-text">No urgent actions at the moment. Great work!</p>
            </div>
        `;
        return;
    }
    
    // Build urgent actions list
    let html = '<div style="padding: 1.5rem;">';
    
    urgentActions.slice(0, 10).forEach(action => {
        let priorityColor = '';
        let priorityLabel = '';
        
        switch (action.priority) {
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
        
        html += `
            <div style="border-left: 4px solid ${priorityColor}; padding: 1rem; margin-bottom: 1rem; background: #F9FAFB; border-radius: 0 0.5rem 0.5rem 0;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <div>
                        <span style="font-size: 0.75rem; font-weight: 700; color: ${priorityColor}; letter-spacing: 0.05em;">${priorityLabel}</span>
                        <h4 style="font-size: 1rem; font-weight: 600; margin: 0.25rem 0;">${action.title}</h4>
                        <p style="color: #6B7280; font-size: 0.875rem; margin: 0;">${action.description}</p>
                    </div>
                    <button class="btn btn-primary btn-small" onclick="${action.action}">View</button>
                </div>
            </div>
        `;
    });
    
    if (urgentActions.length > 10) {
        html += `<p style="text-align: center; color: #6B7280; font-size: 0.875rem; margin-top: 1rem;">+ ${urgentActions.length - 10} more actions</p>`;
    }
    
    html += '</div>';
    
    container.innerHTML = html;
}

// Helper functions to get data
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

function getEnquiries() {
    const enquiriesStr = localStorage.getItem('nhp_enquiries');
    return enquiriesStr ? JSON.parse(enquiriesStr) : [];
}

function getLegalDocuments() {
    const documents = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('nhp_document_')) {
            const doc = JSON.parse(localStorage.getItem(key));
            // Only include legal documents (GDPR filtering)
            if (doc.category === 'legal' || doc.category === 'searches' || 
                doc.category === 'lease' || doc.category === 'transfer' ||
                doc.category === 'enquiries' || doc.category === 'completion') {
                documents.push(doc);
            }
        }
    }
    return documents;
}

// Action handlers
function viewCase(caseId) {
    window.location.href = `case-details.html?id=${caseId}`;
}

function viewDocuments(plotNumber) {
    window.location.href = `documents.html?plot=${plotNumber}`;
}

function viewEnquiry(enquiryId) {
    window.location.href = `enquiries.html?id=${enquiryId}`;
}

function requestDocument(plotNumber, docType) {
    // Navigate to enquiries and pre-fill a document request
    window.location.href = `enquiries.html?action=request&plot=${plotNumber}&docType=${docType}`;
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
