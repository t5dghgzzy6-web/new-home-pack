// Solicitor Documents JavaScript
// Manage legal documents with GDPR filtering

// Check authentication
checkAuth('solicitor');

let allDocuments = [];
let allCases = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    loadData();
    populateFilterDropdowns();
    loadDocumentChecklist();
    loadAllDocuments();
    
    // Check for URL parameters (e.g., pre-filter by plot)
    const urlParams = new URLSearchParams(window.location.search);
    const plotParam = urlParams.get('plot');
    if (plotParam) {
        document.getElementById('filterPlot').value = plotParam;
        filterDocuments();
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
    
    // Get all legal documents (GDPR filtered)
    allDocuments = getLegalDocuments();
}

// Populate filter dropdowns
function populateFilterDropdowns() {
    const plotSelect = document.getElementById('filterPlot');
    const requestPlotSelect = document.getElementById('requestPlot');
    
    // Clear existing options (except first)
    plotSelect.innerHTML = '<option value="">All Plots</option>';
    requestPlotSelect.innerHTML = '<option value="">Select plot...</option>';
    
    // Add plot options from cases
    allCases.forEach(caseData => {
        const option = document.createElement('option');
        option.value = caseData.plotNumber;
        option.textContent = `Plot ${caseData.plotNumber} - ${caseData.buyerName}`;
        plotSelect.appendChild(option);
        
        const requestOption = option.cloneNode(true);
        requestPlotSelect.appendChild(requestOption);
    });
}

// Load document checklist
function loadDocumentChecklist() {
    const container = document.getElementById('documentChecklist');
    
    if (allCases.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3 class="empty-state-title">No Cases Yet</h3>
                <p class="empty-state-text">Your assigned cases will appear here.</p>
            </div>
        `;
        return;
    }
    
    // Required documents for conveyancing
    const requiredDocs = [
        { type: 'searches', name: 'Local Authority Searches', icon: '🔍' },
        { type: 'lease', name: 'Lease Documentation', icon: '📜' },
        { type: 'transfer', name: 'Transfer Deed', icon: '📋' },
        { type: 'enquiries', name: 'Pre-Contract Enquiries', icon: '❓' },
        { type: 'completion', name: 'Completion Statement', icon: '💰' }
    ];
    
    let html = '<div style="padding: 1.5rem;">';
    
    let totalDocs = 0;
    let receivedDocs = 0;
    
    allCases.forEach(caseData => {
        const caseDocuments = allDocuments.filter(d => d.plotNumber === caseData.plotNumber);
        
        // Calculate case progress
        const caseReceived = requiredDocs.filter(reqDoc => 
            caseDocuments.some(d => d.category === reqDoc.type)
        ).length;
        const caseTotal = requiredDocs.length;
        const caseProgress = Math.round((caseReceived / caseTotal) * 100);
        
        totalDocs += caseTotal;
        receivedDocs += caseReceived;
        
        // Determine status color
        let statusColor = '';
        if (caseProgress === 100) {
            statusColor = '#10B981'; // Green
        } else if (caseProgress >= 60) {
            statusColor = '#3B82F6'; // Blue
        } else if (caseProgress >= 30) {
            statusColor = '#F59E0B'; // Orange
        } else {
            statusColor = '#DC2626'; // Red
        }
        
        html += `
            <div style="border: 1px solid #E5E7EB; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1rem; background: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div>
                        <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.25rem;">
                            Plot ${caseData.plotNumber} - ${caseData.buyerName}
                        </h3>
                        <p style="color: #6B7280; font-size: 0.875rem;">${caseData.developmentName || 'Development'}</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 1.5rem; font-weight: 700; color: ${statusColor};">
                            ${caseProgress}%
                        </div>
                        <div style="font-size: 0.75rem; color: #6B7280;">
                            ${caseReceived} of ${caseTotal}
                        </div>
                    </div>
                </div>
                
                <!-- Progress Bar -->
                <div style="background: #E5E7EB; height: 0.5rem; border-radius: 0.25rem; margin-bottom: 1rem; overflow: hidden;">
                    <div style="background: ${statusColor}; height: 100%; width: ${caseProgress}%; transition: width 0.3s ease;"></div>
                </div>
                
                <!-- Document Checklist -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
        `;
        
        requiredDocs.forEach(reqDoc => {
            const hasDoc = caseDocuments.some(d => d.category === reqDoc.type);
            const doc = caseDocuments.find(d => d.category === reqDoc.type);
            
            html += `
                <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-radius: 0.375rem; background: ${hasDoc ? '#F0FDF4' : '#FEF2F2'};">
                    <span style="font-size: 1.25rem;">${hasDoc ? '✅' : '❌'}</span>
                    <div style="flex: 1;">
                        <div style="font-size: 0.875rem; font-weight: 500;">${reqDoc.name}</div>
                        ${hasDoc ? `<div style="font-size: 0.75rem; color: #10B981;">Received ${new Date(doc.uploadDate).toLocaleDateString()}</div>` : ''}
                    </div>
                    ${!hasDoc ? `<button class="btn-icon" onclick="requestSpecificDocument('${caseData.plotNumber}', '${reqDoc.type}')" title="Request document">➕</button>` : ''}
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
    
    // Update checklist stats
    const overallProgress = Math.round((receivedDocs / totalDocs) * 100);
    document.getElementById('checklistStats').textContent = 
        `Overall Progress: ${receivedDocs}/${totalDocs} documents (${overallProgress}%)`;
}

// Load all documents table
function loadAllDocuments() {
    const container = document.getElementById('documentsTable');
    
    if (allDocuments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📄</div>
                <h3 class="empty-state-title">No Documents Yet</h3>
                <p class="empty-state-text">Legal documents will appear here as they are uploaded.</p>
                <button class="btn btn-primary" style="margin-top: 1rem;" onclick="requestDocument()">
                    Request Document
                </button>
            </div>
        `;
        return;
    }
    
    // Build documents table
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Plot</th>
                    <th>Buyer</th>
                    <th>Uploaded</th>
                    <th>Size</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    allDocuments
        .sort((a, b) => b.uploadDate - a.uploadDate)
        .forEach(doc => {
            const caseData = allCases.find(c => c.plotNumber === doc.plotNumber);
            const buyerName = caseData ? caseData.buyerName : 'Unknown';
            
            // Document type display name
            const typeNames = {
                'searches': 'Local Searches',
                'lease': 'Lease',
                'transfer': 'Transfer Deed',
                'enquiries': 'Enquiries',
                'completion': 'Completion Statement',
                'legal': 'Legal Document'
            };
            const typeName = typeNames[doc.category] || doc.category;
            
            // File size display
            const sizeDisplay = doc.size ? formatFileSize(doc.size) : 'N/A';
            
            html += `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="font-size: 1.5rem;">📄</span>
                            <div>
                                <div style="font-weight: 600;">${doc.title}</div>
                                ${doc.description ? `<div style="font-size: 0.75rem; color: #6B7280;">${doc.description}</div>` : ''}
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="status-badge status-active">${typeName}</span>
                    </td>
                    <td><strong>Plot ${doc.plotNumber}</strong></td>
                    <td>${buyerName}</td>
                    <td>${new Date(doc.uploadDate).toLocaleDateString()}</td>
                    <td>${sizeDisplay}</td>
                    <td>
                        <button class="btn-icon" onclick="viewDocument('${doc.id}')" title="View document">
                            👁️
                        </button>
                        <button class="btn-icon" onclick="downloadDocument('${doc.id}')" title="Download">
                            📥
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

// Filter documents
function filterDocuments() {
    const plotFilter = document.getElementById('filterPlot').value;
    const typeFilter = document.getElementById('filterType').value;
    const statusFilter = document.getElementById('filterStatus').value;
    
    // Apply filters to allDocuments
    let filtered = allDocuments;
    
    if (plotFilter) {
        filtered = filtered.filter(d => d.plotNumber === plotFilter);
    }
    
    if (typeFilter) {
        filtered = filtered.filter(d => d.category === typeFilter);
    }
    
    if (statusFilter) {
        // Filter by case status
        const casesFiltered = allCases.filter(c => {
            if (statusFilter === 'active') {
                return !c.exchangeDate;
            } else if (statusFilter === 'urgent') {
                const reservationDate = new Date(c.reservationDate);
                const exchangeDeadline = new Date(reservationDate);
                exchangeDeadline.setDate(exchangeDeadline.getDate() + 28);
                const daysRemaining = Math.ceil((exchangeDeadline - new Date()) / (1000 * 60 * 60 * 24));
                return daysRemaining <= 7 && !c.exchangeDate;
            } else if (statusFilter === 'exchanged') {
                return c.exchangeDate;
            }
            return true;
        });
        
        const plotNumbers = casesFiltered.map(c => c.plotNumber);
        filtered = filtered.filter(d => plotNumbers.includes(d.plotNumber));
    }
    
    // Temporarily replace allDocuments for display
    const originalDocs = allDocuments;
    allDocuments = filtered;
    loadAllDocuments();
    allDocuments = originalDocs;
}

// Clear filters
function clearFilters() {
    document.getElementById('filterPlot').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterStatus').value = '';
    loadAllDocuments();
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

function getLegalDocuments() {
    const documents = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('nhp_document_')) {
            const doc = JSON.parse(localStorage.getItem(key));
            // GDPR filtering - only legal documents accessible to solicitors
            if (doc.category === 'legal' || doc.category === 'searches' || 
                doc.category === 'lease' || doc.category === 'transfer' ||
                doc.category === 'enquiries' || doc.category === 'completion') {
                documents.push(doc);
            }
        }
    }
    return documents;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Document actions
function viewDocument(docId) {
    // In production, this would open a secure document viewer
    showNotification('Document viewer opening...', 'info');
    // Simulate opening document
    setTimeout(() => {
        window.open('#', '_blank');
    }, 500);
}

function downloadDocument(docId) {
    const doc = allDocuments.find(d => d.id === docId);
    if (!doc) {
        showNotification('Document not found', 'error');
        return;
    }
    
    // In production, this would trigger actual download
    showNotification(`Downloading: ${doc.title}`, 'success');
}

function downloadAll() {
    if (allDocuments.length === 0) {
        showNotification('No documents to download', 'error');
        return;
    }
    
    showNotification(`Preparing ${allDocuments.length} documents for download...`, 'info');
    
    // In production, this would create a ZIP file of all documents
    setTimeout(() => {
        showNotification('Download started', 'success');
    }, 1500);
}

// Request document modal
function requestDocument() {
    document.getElementById('requestModal').style.display = 'flex';
}

function requestSpecificDocument(plotNumber, docType) {
    document.getElementById('requestPlot').value = plotNumber;
    document.getElementById('requestDocType').value = docType;
    requestDocument();
}

function closeRequestModal() {
    document.getElementById('requestModal').style.display = 'none';
    document.getElementById('requestForm').reset();
}

function submitRequest(event) {
    event.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('nhp_user'));
    const plotNumber = document.getElementById('requestPlot').value;
    const docType = document.getElementById('requestDocType').value;
    const description = document.getElementById('requestDescription').value;
    const urgency = document.getElementById('requestUrgency').value;
    
    // Create enquiry for document request
    const enquiry = {
        id: 'ENQ-' + Date.now(),
        plotNumber: plotNumber,
        solicitorEmail: user.email,
        solicitorName: user.name,
        type: 'document_request',
        subject: `Document Request: ${docType}`,
        description: description,
        urgency: urgency,
        status: 'pending',
        date: Date.now(),
        responses: []
    };
    
    // Save enquiry
    const enquiries = getEnquiries();
    enquiries.push(enquiry);
    localStorage.setItem('nhp_enquiries', JSON.stringify(enquiries));
    
    showNotification('Document request sent to developer', 'success');
    closeRequestModal();
    
    // Refresh data
    setTimeout(() => {
        loadData();
        loadDocumentChecklist();
    }, 500);
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
