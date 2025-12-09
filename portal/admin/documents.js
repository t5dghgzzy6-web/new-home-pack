// Signed Documents Management

let allDocuments = [];
let filteredDocuments = [];

document.addEventListener('DOMContentLoaded', () => {
    checkAuthWithRole(['admin', 'developer', 'sales']);
    loadCurrentUser();
    loadSignedDocuments();
    updateSummaryCards();
});

function loadCurrentUser() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.name || user.email;
    }
}

// Load all signed reservation agreements
function loadSignedDocuments() {
    // Get all reservations from localStorage
    const reservations = JSON.parse(localStorage.getItem('nhp_reservations') || '[]');
    
    // Transform into document records
    allDocuments = reservations.map(reservation => {
        const buyers = reservation.buyers || [
            { number: 1, name: `${reservation.firstName} ${reservation.lastName}`, email: reservation.email, role: 'primary' }
        ];
        
        return {
            id: reservation.reservationId,
            plot: reservation.plot || { number: 'Unknown', development: 'Unknown' },
            buyers: buyers,
            signedDate: reservation.reservationDate,
            status: reservation.signatures?.method === 'docusign' ? 
                (checkDocuSignStatus(reservation.docuSignEnvelopeId) || 'pending') : 'completed',
            method: reservation.signatures?.method === 'docusign' ? 'DocuSign' : 'Canvas Signature',
            signatureData: reservation.signatures,
            customTCs: reservation.customTCs || false,
            solicitorDelivered: checkSolicitorDelivery(reservation.reservationId),
            solicitorInfo: {
                firm: reservation.ownSolicitorFirm || reservation.selectedSolicitor?.name || 'Not provided',
                email: reservation.ownSolicitorEmail || reservation.selectedSolicitor?.email || null
            },
            docuSignEnvelopeId: reservation.docuSignEnvelopeId,
            paymentReceipt: reservation.payment || null
        };
    });
    
    filteredDocuments = [...allDocuments];
    renderDocuments();
}

// Check DocuSign status (in production, this would call DocuSign API)
function checkDocuSignStatus(envelopeId) {
    if (!envelopeId) return null;
    
    const envelopeData = JSON.parse(localStorage.getItem('nhp_docusign_envelope') || '{}');
    
    // Simulate status check
    if (envelopeData.envelopeId === envelopeId) {
        return envelopeData.status || 'sent'; // sent, completed, declined, voided
    }
    
    return 'completed'; // Default for demo
}

// Check if document was delivered to solicitor
function checkSolicitorDelivery(reservationId) {
    const deliveries = JSON.parse(localStorage.getItem('nhp_solicitor_deliveries') || '[]');
    const delivery = deliveries.find(d => d.reservationId === reservationId);
    return delivery ? delivery.status : null;
}

// Update summary cards
function updateSummaryCards() {
    const totalSigned = allDocuments.filter(d => d.status === 'completed').length;
    const pending = allDocuments.filter(d => d.status === 'pending' || d.status === 'sent').length;
    
    // This month (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thisMonth = allDocuments.filter(d => new Date(d.signedDate) > thirtyDaysAgo).length;
    
    const sentToSolicitors = allDocuments.filter(d => d.solicitorDelivered === 'sent' || d.solicitorDelivered === 'delivered').length;
    
    document.getElementById('totalSigned').textContent = totalSigned;
    document.getElementById('pendingSignatures').textContent = pending;
    document.getElementById('thisMonth').textContent = thisMonth;
    document.getElementById('sentToSolicitors').textContent = sentToSolicitors;
}

// Render documents table
function renderDocuments() {
    const tbody = document.getElementById('documentsTableBody');
    const emptyState = document.getElementById('emptyState');
    
    if (filteredDocuments.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    tbody.innerHTML = filteredDocuments.map(doc => {
        const statusBadge = getStatusBadge(doc.status);
        const buyerNames = doc.buyers.map(b => b.name).join(', ');
        const signedDate = new Date(doc.signedDate).toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
        
        const solicitorBadge = getSolicitorDeliveryBadge(doc.solicitorDelivered);
        
        return `
            <tr onclick="viewDocument('${doc.id}')" style="cursor: pointer;">
                <td>
                    <div style="font-weight: 600;">${doc.plot.number}</div>
                    <div style="font-size: 0.75rem; color: var(--gray-600);">${doc.plot.development}</div>
                </td>
                <td>
                    <div style="font-weight: 500;">${buyerNames}</div>
                    <div style="font-size: 0.75rem; color: var(--gray-600);">${doc.buyers.length} buyer${doc.buyers.length > 1 ? 's' : ''}</div>
                </td>
                <td>${signedDate}</td>
                <td>${statusBadge}</td>
                <td>
                    <div style="font-size: 0.875rem;">${doc.method}</div>
                    ${doc.docuSignEnvelopeId ? `<div style="font-size: 0.7rem; color: var(--gray-500);">${doc.docuSignEnvelopeId}</div>` : ''}
                </td>
                <td>${solicitorBadge}</td>
                <td onclick="event.stopPropagation()">
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="downloadDocument('${doc.id}')" class="btn btn-secondary btn-small" title="Download PDF">
                            ⬇️
                        </button>
                        <button onclick="sendToSolicitor('${doc.id}')" class="btn btn-secondary btn-small" title="Send to Solicitor">
                            📧
                        </button>
                        <button onclick="viewDocument('${doc.id}')" class="btn btn-secondary btn-small" title="View Details">
                            👁️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        'completed': '<span class="status-badge status-success">Fully Signed</span>',
        'pending': '<span class="status-badge status-warning">Pending</span>',
        'sent': '<span class="status-badge status-warning">Sent</span>',
        'draft': '<span class="status-badge status-gray">Draft</span>',
        'declined': '<span class="status-badge status-error">Declined</span>'
    };
    
    return badges[status] || badges['draft'];
}

// Get solicitor delivery badge
function getSolicitorDeliveryBadge(status) {
    if (!status) {
        return '<span class="status-badge status-gray">Not Sent</span>';
    }
    
    const badges = {
        'sent': '<span class="status-badge status-warning">Sent</span>',
        'delivered': '<span class="status-badge status-success">Delivered</span>',
        'failed': '<span class="status-badge status-error">Failed</span>'
    };
    
    return badges[status] || '<span class="status-badge status-gray">Unknown</span>';
}

// Filter documents
function filterDocuments() {
    const statusFilter = document.getElementById('filterStatus').value;
    const methodFilter = document.getElementById('filterMethod').value;
    const developmentFilter = document.getElementById('filterDevelopment').value;
    const searchQuery = document.getElementById('searchDocuments').value.toLowerCase();
    
    filteredDocuments = allDocuments.filter(doc => {
        // Status filter
        if (statusFilter && doc.status !== statusFilter) return false;
        
        // Method filter
        if (methodFilter && doc.method.toLowerCase() !== methodFilter) return false;
        
        // Development filter
        if (developmentFilter) {
            const devMatch = doc.plot.development.toLowerCase().includes(developmentFilter);
            if (!devMatch) return false;
        }
        
        // Search filter
        if (searchQuery) {
            const plotMatch = doc.plot.number.toLowerCase().includes(searchQuery);
            const buyerMatch = doc.buyers.some(b => b.name.toLowerCase().includes(searchQuery));
            const devMatch = doc.plot.development.toLowerCase().includes(searchQuery);
            
            if (!plotMatch && !buyerMatch && !devMatch) return false;
        }
        
        return true;
    });
    
    renderDocuments();
}

// Sort documents
function sortDocuments(field) {
    filteredDocuments.sort((a, b) => {
        if (field === 'date') {
            return new Date(b.signedDate) - new Date(a.signedDate);
        } else if (field === 'plot') {
            return a.plot.number.localeCompare(b.plot.number);
        }
        return 0;
    });
    
    renderDocuments();
}

// View document details
function viewDocument(documentId) {
    const doc = allDocuments.find(d => d.id === documentId);
    if (!doc) return;
    
    const modal = document.getElementById('documentModal');
    const modalBody = document.getElementById('documentModalBody');
    
    const buyersHTML = doc.buyers.map(buyer => `
        <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: var(--gray-50); border-radius: 6px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary-red); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem;">
                ${buyer.number}
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 0.875rem;">${buyer.name}</div>
                <div style="font-size: 0.75rem; color: var(--gray-600);">${buyer.email}</div>
            </div>
            <div style="font-size: 0.75rem; color: var(--gray-600);">${buyer.role === 'primary' ? 'Primary' : 'Additional'}</div>
        </div>
    `).join('');
    
    const signedDate = new Date(doc.signedDate).toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    modalBody.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 1.5rem;">
                <div>
                    <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">${doc.plot.number}</h3>
                    <p style="font-size: 0.875rem; color: var(--gray-600);">${doc.plot.development}</p>
                </div>
                <div style="text-align: right;">
                    ${getStatusBadge(doc.status)}
                    <div style="font-size: 0.75rem; color: var(--gray-600); margin-top: 0.5rem;">${signedDate}</div>
                </div>
            </div>
            
            <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <h4 style="font-weight: 600; margin-bottom: 1rem;">Buyers (${doc.buyers.length})</h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${buyersHTML}
                </div>
            </div>
            
            <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <h4 style="font-weight: 600; margin-bottom: 1rem;">Signature Details</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div>
                        <div style="font-size: 0.75rem; color: var(--gray-600); margin-bottom: 0.25rem;">Method</div>
                        <div style="font-weight: 600;">${doc.method}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--gray-600); margin-bottom: 0.25rem;">T&Cs Type</div>
                        <div style="font-weight: 600;">${doc.customTCs ? 'Custom' : 'Platform Standard'}</div>
                    </div>
                    ${doc.docuSignEnvelopeId ? `
                        <div style="grid-column: 1 / -1;">
                            <div style="font-size: 0.75rem; color: var(--gray-600); margin-bottom: 0.25rem;">DocuSign Envelope ID</div>
                            <div style="font-family: monospace; font-size: 0.875rem;">${doc.docuSignEnvelopeId}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <h4 style="font-weight: 600; margin-bottom: 1rem;">Solicitor Information</h4>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div>
                        <div style="font-size: 0.75rem; color: var(--gray-600); margin-bottom: 0.25rem;">Firm</div>
                        <div style="font-weight: 600;">${doc.solicitorInfo.firm}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--gray-600); margin-bottom: 0.25rem;">Delivery Status</div>
                        ${getSolicitorDeliveryBadge(doc.solicitorDelivered)}
                    </div>
                    ${doc.solicitorInfo.email ? `
                        <div style="grid-column: 1 / -1;">
                            <div style="font-size: 0.75rem; color: var(--gray-600); margin-bottom: 0.25rem;">Email</div>
                            <div style="font-size: 0.875rem;">${doc.solicitorInfo.email}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                <button onclick="downloadDocument('${doc.id}')" class="btn btn-primary" style="width: 100%;">
                    ⬇️ Download Agreement (PDF)
                </button>
                <button onclick="sendToSolicitor('${doc.id}')" class="btn btn-secondary" style="width: 100%;">
                    📧 Send to Solicitor
                </button>
            </div>
            
            ${!doc.solicitorDelivered ? `
                <div style="background: #FFF9E6; border: 1px solid #F59E0B; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                    <p style="font-size: 0.875rem; color: #92400E; margin: 0;">
                        ⚠️ <strong>Note:</strong> This agreement has not been sent to the solicitor yet. Click "Send to Solicitor" to deliver it.
                    </p>
                </div>
            ` : ''}
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Close document modal
function closeDocumentModal() {
    document.getElementById('documentModal').style.display = 'none';
}

// Download document as PDF
function downloadDocument(documentId) {
    const doc = allDocuments.find(d => d.id === documentId);
    if (!doc) return;
    
    showNotification('Preparing document for download...', 'info');
    
    // In production, this would generate actual PDF with signatures
    // For MVP, we'll create a comprehensive document package
    
    const documentPackage = {
        reservationAgreement: {
            id: doc.id,
            plot: doc.plot,
            buyers: doc.buyers,
            signedDate: doc.signedDate,
            signatures: doc.signatureData,
            customTCs: doc.customTCs
        },
        propertyPack: {
            // Include all property pack documents
            titleDeeds: 'Included',
            searches: 'Included',
            planningPermissions: 'Included',
            warranties: 'Included'
        },
        paymentReceipt: doc.paymentReceipt,
        format: 'PDF',
        generatedDate: new Date().toISOString()
    };
    
    // Store for download tracking
    const downloads = JSON.parse(localStorage.getItem('nhp_document_downloads') || '[]');
    downloads.push({
        documentId: doc.id,
        downloadedBy: getCurrentUser()?.email,
        downloadedAt: new Date().toISOString(),
        type: 'reservation_agreement'
    });
    localStorage.setItem('nhp_document_downloads', JSON.stringify(downloads));
    
    // Simulate download
    setTimeout(() => {
        console.log('Document Package:', documentPackage);
        showNotification(`Reservation Agreement for ${doc.plot.number} downloaded successfully`, 'success');
        
        // In production, trigger actual PDF download:
        // const blob = generatePDF(documentPackage);
        // const url = URL.createObjectURL(blob);
        // const a = document.createElement('a');
        // a.href = url;
        // a.download = `Reservation_Agreement_${doc.plot.number.replace(' ', '_')}_${doc.id}.pdf`;
        // a.click();
    }, 1500);
}

// Send document to solicitor
function sendToSolicitor(documentId) {
    const doc = allDocuments.find(d => d.id === documentId);
    if (!doc) return;
    
    if (!doc.solicitorInfo.email) {
        showNotification('No solicitor email address on file', 'error');
        return;
    }
    
    // Show confirmation modal
    const confirmed = confirm(
        `Send reservation agreement for ${doc.plot.number} to ${doc.solicitorInfo.firm}?\n\n` +
        `Email: ${doc.solicitorInfo.email}\n\n` +
        `The following will be sent:\n` +
        `• Signed Reservation Agreement\n` +
        `• Property Information Pack\n` +
        `• Payment Receipt\n` +
        `• All supporting documents`
    );
    
    if (!confirmed) return;
    
    showNotification('Sending documents to solicitor...', 'info');
    
    // In production, this would send via email API
    const emailData = {
        to: doc.solicitorInfo.email,
        cc: doc.buyers.map(b => b.email),
        subject: `Reservation Agreement - ${doc.plot.number}, ${doc.plot.development}`,
        body: generateSolicitorEmail(doc),
        attachments: [
            {
                filename: `Reservation_Agreement_${doc.plot.number.replace(' ', '_')}.pdf`,
                content: 'base64_encoded_pdf_data'
            },
            {
                filename: `Property_Pack_${doc.plot.number.replace(' ', '_')}.pdf`,
                content: 'base64_encoded_pack_data'
            },
            {
                filename: `Payment_Receipt_${doc.id}.pdf`,
                content: 'base64_encoded_receipt_data'
            }
        ]
    };
    
    /* Production email sending would look like:
    fetch('/api/send-solicitor-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
    })
    .then(response => response.json())
    .then(data => {
        // Update delivery status
        updateSolicitorDelivery(documentId, 'sent');
    });
    */
    
    // Simulate email sending
    setTimeout(() => {
        updateSolicitorDelivery(documentId, 'sent');
        showNotification(`Documents sent to ${doc.solicitorInfo.firm} successfully`, 'success');
        closeDocumentModal();
        loadSignedDocuments(); // Refresh
    }, 2000);
}

// Generate solicitor email content
function generateSolicitorEmail(doc) {
    const buyerNames = doc.buyers.map(b => b.name).join(' and ');
    
    return `
Dear ${doc.solicitorInfo.firm},

RE: New Build Property Purchase - ${doc.plot.number}, ${doc.plot.development}

We are writing to confirm that your client${doc.buyers.length > 1 ? 's' : ''}, ${buyerNames}, ${doc.buyers.length > 1 ? 'have' : 'has'} reserved the above property.

Please find attached:
1. Fully signed Reservation Agreement
2. Complete Property Information Pack
3. Payment receipt for reservation fee
4. All supporting documentation

Key Details:
- Property: ${doc.plot.number}, ${doc.plot.development}
- Reservation Date: ${new Date(doc.signedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
- Purchase Price: £${doc.plot.price?.toLocaleString() || 'TBC'}
- Reservation Period: 28 days from signing
- Number of Buyers: ${doc.buyers.length}

The reservation agreement was signed using ${doc.method} and includes ${doc.customTCs ? 'developer-specific' : 'platform standard'} terms and conditions.

All buyers have been copied on this email for their records.

Please confirm receipt and advise if you require any additional information to proceed with the conveyancing.

Kind regards,
New Home Pack Platform
    `.trim();
}

// Update solicitor delivery status
function updateSolicitorDelivery(documentId, status) {
    const deliveries = JSON.parse(localStorage.getItem('nhp_solicitor_deliveries') || '[]');
    
    // Remove existing entry for this document
    const filtered = deliveries.filter(d => d.reservationId !== documentId);
    
    // Add new entry
    filtered.push({
        reservationId: documentId,
        status: status, // sent, delivered, failed
        sentAt: new Date().toISOString(),
        sentBy: getCurrentUser()?.email
    });
    
    localStorage.setItem('nhp_solicitor_deliveries', JSON.stringify(filtered));
}

// Export documents report
function exportDocuments() {
    showNotification('Generating export...', 'info');
    
    const csvData = [
        ['Plot', 'Development', 'Buyers', 'Signed Date', 'Status', 'Method', 'Solicitor', 'Delivered'].join(',')
    ];
    
    filteredDocuments.forEach(doc => {
        const row = [
            doc.plot.number,
            doc.plot.development,
            doc.buyers.map(b => b.name).join(' & '),
            new Date(doc.signedDate).toLocaleDateString('en-GB'),
            doc.status,
            doc.method,
            doc.solicitorInfo.firm,
            doc.solicitorDelivered || 'No'
        ].join(',');
        
        csvData.push(row);
    });
    
    setTimeout(() => {
        console.log('CSV Export:', csvData.join('\n'));
        showNotification('Report exported successfully', 'success');
    }, 1000);
}

// Bulk download selected documents
function bulkDownload() {
    showNotification('Preparing bulk download...', 'info');
    
    // In production, this would create a ZIP file with all selected documents
    setTimeout(() => {
        showNotification(`Preparing ${filteredDocuments.length} documents for download`, 'success');
    }, 1500);
}

// Utility: Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'success' ? 'var(--success-green)' : type === 'error' ? 'var(--error-red)' : 'var(--primary-red)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}
