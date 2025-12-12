// Solicitor Enquiries JavaScript
// Raise and track enquiries with developers

// Check authentication
checkAuth('solicitor');

let allEnquiries = [];
let allCases = [];
let currentFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    loadData();
    populatePlotDropdown();
    loadEnquiries();
    updateStats();
    
    // Check for URL parameters (e.g., pre-filled enquiry)
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const plotParam = urlParams.get('plot');
    const docTypeParam = urlParams.get('docType');
    
    if (action === 'request' && plotParam) {
        document.getElementById('enquiryPlot').value = plotParam;
        if (docTypeParam) {
            document.getElementById('enquiryType').value = 'document_request';
            document.getElementById('enquirySubject').value = `Request for ${docTypeParam} document`;
        }
        openNewEnquiryModal();
    }
    
    const enquiryId = urlParams.get('id');
    if (enquiryId) {
        viewEnquiry(enquiryId);
    }
});

// Load user information
function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('nhp_user'));
    if (user && user.name) {
        document.getElementById('userName').textContent = user.name;
    }
}

// Load all data
function loadData() {
    const user = JSON.parse(localStorage.getItem('nhp_user'));
    
    // Get all reservations for this solicitor
    allCases = getAllReservations().filter(r => r.solicitorEmail === user.email);
    
    // Get all enquiries for this solicitor
    const allEnquiriesData = getEnquiries();
    allEnquiries = allEnquiriesData.filter(e => e.solicitorEmail === user.email);
}

// Populate plot dropdown
function populatePlotDropdown() {
    const plotSelect = document.getElementById('enquiryPlot');
    plotSelect.innerHTML = '<option value="">Select plot...</option>';
    
    allCases.forEach(caseData => {
        const option = document.createElement('option');
        option.value = caseData.plotNumber;
        option.textContent = `Plot ${caseData.plotNumber} - ${caseData.buyerName}`;
        plotSelect.appendChild(option);
    });
}

// Update statistics
function updateStats() {
    const total = allEnquiries.length;
    const pending = allEnquiries.filter(e => e.status === 'pending').length;
    const answered = allEnquiries.filter(e => e.status === 'answered').length;
    
    document.getElementById('totalEnquiries').textContent = total;
    document.getElementById('pendingEnquiries').textContent = pending;
    document.getElementById('answeredEnquiries').textContent = answered;
    document.getElementById('pendingCount').textContent = pending;
    
    // Calculate average response time
    const answeredEnquiries = allEnquiries.filter(e => e.responses && e.responses.length > 0);
    if (answeredEnquiries.length > 0) {
        let totalResponseTime = 0;
        answeredEnquiries.forEach(e => {
            const firstResponse = e.responses[0];
            const responseTime = (firstResponse.date - e.date) / (1000 * 60 * 60 * 24); // days
            totalResponseTime += responseTime;
        });
        const avgDays = Math.round(totalResponseTime / answeredEnquiries.length);
        document.getElementById('avgResponseTime').textContent = `${avgDays}d`;
    }
}

// Load enquiries list
function loadEnquiries() {
    const container = document.getElementById('enquiriesList');
    
    // Filter enquiries based on current filter
    let filtered = allEnquiries;
    if (currentFilter !== 'all') {
        filtered = allEnquiries.filter(e => e.status === currentFilter);
    }
    
    if (filtered.length === 0) {
        const emptyMessages = {
            'all': 'No enquiries yet. Create your first enquiry to get started.',
            'pending': 'No pending enquiries. All caught up!',
            'answered': 'No answered enquiries yet.',
            'resolved': 'No resolved enquiries yet.'
        };
        
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❓</div>
                <h3 class="empty-state-title">No Enquiries</h3>
                <p class="empty-state-text">${emptyMessages[currentFilter]}</p>
                ${currentFilter === 'all' ? '<button class="btn btn-primary" style="margin-top: 1rem;" onclick="openNewEnquiryModal()">Create Enquiry</button>' : ''}
            </div>
        `;
        return;
    }
    
    // Sort by date (newest first)
    filtered.sort((a, b) => b.date - a.date);
    
    let html = '';
    
    filtered.forEach(enquiry => {
        const caseData = allCases.find(c => c.plotNumber === enquiry.plotNumber);
        const buyerName = caseData ? caseData.buyerName : 'Unknown';
        
        // Calculate time elapsed
        const daysSince = Math.floor((Date.now() - enquiry.date) / (1000 * 60 * 60 * 24));
        const timeDisplay = daysSince === 0 ? 'Today' : 
                           daysSince === 1 ? 'Yesterday' : 
                           `${daysSince} days ago`;
        
        // Status badge
        let statusBadge = '';
        let statusColor = '';
        if (enquiry.status === 'pending') {
            statusBadge = '⏳ Pending';
            statusColor = '#F59E0B';
        } else if (enquiry.status === 'answered') {
            statusBadge = '💬 Answered';
            statusColor = '#3B82F6';
        } else if (enquiry.status === 'resolved') {
            statusBadge = '✅ Resolved';
            statusColor = '#10B981';
        }
        
        // Urgency badge
        let urgencyBadge = '';
        if (enquiry.urgency === 'critical') {
            urgencyBadge = '<span style="background: #FEE2E2; color: #DC2626; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem;">🔴 CRITICAL</span>';
        } else if (enquiry.urgency === 'urgent') {
            urgencyBadge = '<span style="background: #FEF3C7; color: #F59E0B; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem;">🟠 URGENT</span>';
        }
        
        // Response count
        const responseCount = enquiry.responses ? enquiry.responses.length : 0;
        const hasUnread = enquiry.responses && enquiry.responses.some(r => !r.read);
        
        html += `
            <div class="enquiry-card" onclick="viewEnquiry('${enquiry.id}')">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                            <h3 style="font-size: 1.125rem; font-weight: 600; margin: 0;">
                                ${enquiry.subject}
                            </h3>
                            ${urgencyBadge}
                        </div>
                        <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: #6B7280;">
                            <span><strong>Plot ${enquiry.plotNumber}</strong> - ${buyerName}</span>
                            <span>•</span>
                            <span>${enquiry.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            <span>•</span>
                            <span>${timeDisplay}</span>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="background: ${statusColor}; color: white; padding: 0.375rem 0.75rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 600; white-space: nowrap;">
                            ${statusBadge}
                        </span>
                        ${responseCount > 0 ? `
                            <span style="background: ${hasUnread ? '#DC2626' : '#E5E7EB'}; color: ${hasUnread ? 'white' : '#6B7280'}; padding: 0.375rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600;">
                                ${responseCount} ${responseCount === 1 ? 'reply' : 'replies'}
                            </span>
                        ` : ''}
                    </div>
                </div>
                
                <p style="color: #4B5563; margin: 0; line-height: 1.5;">
                    ${enquiry.description.length > 150 ? enquiry.description.substring(0, 150) + '...' : enquiry.description}
                </p>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Filter enquiries
function filterEnquiries(filter) {
    currentFilter = filter;
    
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.closest('.filter-tab').classList.add('active');
    
    loadEnquiries();
}

// New enquiry modal
function openNewEnquiryModal() {
    document.getElementById('newEnquiryModal').style.display = 'flex';
}

function closeNewEnquiryModal() {
    document.getElementById('newEnquiryModal').style.display = 'none';
    document.getElementById('newEnquiryForm').reset();
}

function submitEnquiry(event) {
    event.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('nhp_user'));
    
    const enquiry = {
        id: 'ENQ-' + Date.now(),
        plotNumber: document.getElementById('enquiryPlot').value,
        solicitorEmail: user.email,
        solicitorName: user.name,
        type: document.getElementById('enquiryType').value,
        subject: document.getElementById('enquirySubject').value,
        description: document.getElementById('enquiryDescription').value,
        urgency: document.getElementById('enquiryUrgency').value,
        status: 'pending',
        date: Date.now(),
        responses: []
    };
    
    // Save enquiry
    const enquiries = getEnquiries();
    enquiries.push(enquiry);
    localStorage.setItem('nhp_enquiries', JSON.stringify(enquiries));
    
    showNotification('Enquiry submitted successfully', 'success');
    closeNewEnquiryModal();
    
    // Refresh data
    loadData();
    updateStats();
    loadEnquiries();
}

// View enquiry modal
function viewEnquiry(enquiryId) {
    const enquiry = allEnquiries.find(e => e.id === enquiryId);
    if (!enquiry) {
        showNotification('Enquiry not found', 'error');
        return;
    }
    
    const caseData = allCases.find(c => c.plotNumber === enquiry.plotNumber);
    const buyerName = caseData ? caseData.buyerName : 'Unknown';
    
    // Mark responses as read
    if (enquiry.responses) {
        enquiry.responses.forEach(r => r.read = true);
        const allEnquiriesData = getEnquiries();
        const index = allEnquiriesData.findIndex(e => e.id === enquiryId);
        if (index !== -1) {
            allEnquiriesData[index] = enquiry;
            localStorage.setItem('nhp_enquiries', JSON.stringify(allEnquiriesData));
        }
    }
    
    let html = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
            <div>
                <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">${enquiry.subject}</h2>
                <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: #6B7280;">
                    <span><strong>Plot ${enquiry.plotNumber}</strong> - ${buyerName}</span>
                    <span>•</span>
                    <span>${new Date(enquiry.date).toLocaleString()}</span>
                </div>
            </div>
            <button onclick="closeViewEnquiryModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6B7280;">✕</button>
        </div>
        
        <div style="background: #F9FAFB; border-left: 4px solid #DC2626; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #DC2626; letter-spacing: 0.05em; margin-bottom: 0.5rem;">
                YOUR ENQUIRY
            </div>
            <p style="color: #374151; line-height: 1.6; margin: 0; white-space: pre-wrap;">${enquiry.description}</p>
        </div>
    `;
    
    // Responses section
    if (enquiry.responses && enquiry.responses.length > 0) {
        html += '<div style="border-top: 2px solid #E5E7EB; padding-top: 1.5rem; margin-top: 1.5rem;">';
        html += '<h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem;">Responses</h3>';
        
        enquiry.responses.forEach(response => {
            html += `
                <div style="background: #F0FDF4; border-left: 4px solid #10B981; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <div style="font-weight: 600; color: #10B981;">
                            ${response.responderName} (Developer)
                        </div>
                        <div style="font-size: 0.875rem; color: #6B7280;">
                            ${new Date(response.date).toLocaleString()}
                        </div>
                    </div>
                    <p style="color: #374151; line-height: 1.6; margin: 0; white-space: pre-wrap;">${response.message}</p>
                    ${response.attachments ? `
                        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #D1FAE5;">
                            <div style="font-size: 0.75rem; font-weight: 600; color: #10B981; margin-bottom: 0.5rem;">ATTACHMENTS</div>
                            ${response.attachments.map(att => `<div>📎 ${att}</div>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += '</div>';
    } else {
        html += `
            <div style="text-align: center; padding: 2rem; color: #6B7280;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">⏳</div>
                <p style="font-weight: 600;">Awaiting Response</p>
                <p style="font-size: 0.875rem;">The developer will respond to your enquiry soon.</p>
            </div>
        `;
    }
    
    // Action buttons
    html += `
        <div style="display: flex; gap: 1rem; margin-top: 2rem; padding-top: 2rem; border-top: 2px solid #E5E7EB;">
            ${enquiry.status !== 'resolved' ? `
                <button class="btn btn-primary" onclick="markAsResolved('${enquiry.id}')">
                    ✅ Mark as Resolved
                </button>
            ` : ''}
            <button class="btn btn-secondary" onclick="closeViewEnquiryModal()">
                Close
            </button>
        </div>
    `;
    
    document.getElementById('enquiryDetails').innerHTML = html;
    document.getElementById('viewEnquiryModal').style.display = 'flex';
}

function closeViewEnquiryModal() {
    document.getElementById('viewEnquiryModal').style.display = 'none';
    loadData();
    loadEnquiries();
    updateStats();
}

function markAsResolved(enquiryId) {
    const allEnquiriesData = getEnquiries();
    const index = allEnquiriesData.findIndex(e => e.id === enquiryId);
    
    if (index !== -1) {
        allEnquiriesData[index].status = 'resolved';
        localStorage.setItem('nhp_enquiries', JSON.stringify(allEnquiriesData));
        showNotification('Enquiry marked as resolved', 'success');
        closeViewEnquiryModal();
    }
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

function getEnquiries() {
    const enquiriesStr = localStorage.getItem('nhp_enquiries');
    return enquiriesStr ? JSON.parse(enquiriesStr) : [];
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
    
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    
    .modal-content {
        background: white;
        border-radius: 0.75rem;
        padding: 2rem;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
    }
`;
document.head.appendChild(style);
