// Reservations Management Logic

let allReservations = [];
let filteredReservations = [];

document.addEventListener('DOMContentLoaded', () => {
    checkAuthWithRole('developer');
    loadCurrentUser();
    loadReservations();
});

function loadCurrentUser() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.name || user.email;
    }
}

// Load all reservations
function loadReservations() {
    allReservations = JSON.parse(localStorage.getItem('nhp_reservations') || '[]');
    filteredReservations = [...allReservations];
    
    updateSummaryCards();
    renderReservationsTable();
}

// Update summary cards
function updateSummaryCards() {
    document.getElementById('totalReservations').textContent = allReservations.length;
    
    const pendingSignatures = allReservations.filter(r => r.status === 'pending-signatures').length;
    document.getElementById('pendingSignatures').textContent = pendingSignatures;
    
    const fullySigned = allReservations.filter(r => r.status === 'fully-signed' || r.status === 'solicitor-instructed' || r.status === 'searches-ordered').length;
    document.getElementById('fullySigned').textContent = fullySigned;
    
    const exchanged = allReservations.filter(r => r.status === 'exchanged' || r.status === 'completed').length;
    document.getElementById('exchangedCount').textContent = exchanged;
}

// Render reservations table
function renderReservationsTable() {
    const tbody = document.getElementById('reservationsTableBody');
    
    if (filteredReservations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 3rem; color: var(--gray-500);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
                    <div>No reservations found</div>
                </td>
            </tr>
        `;
        document.getElementById('filteredCount').textContent = '0';
        return;
    }

    document.getElementById('filteredCount').textContent = filteredReservations.length;

    tbody.innerHTML = filteredReservations.map(reservation => {
        const reservedDate = new Date(reservation.reservationDate);
        const daysRemaining = calculateDaysToExchange(reservedDate);
        const statusInfo = getStatusInfo(reservation.status);
        const signatureInfo = getSignatureInfo(reservation);

        return `
            <tr style="cursor: pointer;" onclick="viewReservationDetails('${reservation.reservationId}')">
                <td>
                    <div style="font-weight: 600; font-family: monospace; font-size: 0.875rem;">${reservation.reservationId}</div>
                </td>
                <td>
                    <div style="font-weight: 600;">${reservation.plot?.number || 'N/A'}</div>
                    <div style="font-size: 0.875rem; color: var(--gray-600);">£${(reservation.plot?.price || 0).toLocaleString()}</div>
                </td>
                <td>${reservation.plot?.development || 'N/A'}</td>
                <td>
                    <div style="font-weight: 600;">${reservation.buyers?.[0]?.name || 'N/A'}</div>
                    ${reservation.buyers?.length > 1 ? `<div style="font-size: 0.75rem; color: var(--gray-600);">+${reservation.buyers.length - 1} more</div>` : ''}
                </td>
                <td>
                    <div>${reservedDate.toLocaleDateString('en-GB')}</div>
                    <div style="font-size: 0.75rem; color: var(--gray-600);">${reservedDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td>
                    <span class="status-badge status-${statusInfo.color}">${statusInfo.label}</span>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        ${signatureInfo.icon}
                        <span style="font-size: 0.875rem;">${signatureInfo.text}</span>
                    </div>
                </td>
                <td>
                    <div style="font-weight: 600; color: ${daysRemaining <= 7 ? 'var(--error-red)' : daysRemaining <= 14 ? '#F59E0B' : 'var(--gray-700)'}">
                        ${daysRemaining > 0 ? daysRemaining + ' days' : 'Expired'}
                    </div>
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button onclick="event.stopPropagation(); viewReservationDetails('${reservation.reservationId}')" class="btn btn-secondary btn-small" title="View Details">
                            👁️
                        </button>
                        <button onclick="event.stopPropagation(); downloadSignedDocuments('${reservation.reservationId}')" class="btn btn-secondary btn-small" title="Download Documents">
                            ⬇️
                        </button>
                        <button onclick="event.stopPropagation(); sendToSolicitors('${reservation.reservationId}')" class="btn btn-secondary btn-small" title="Send to Solicitors">
                            📧
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Calculate days remaining to exchange (28 days from reservation)
function calculateDaysToExchange(reservedDate) {
    const exchangeDeadline = new Date(reservedDate);
    exchangeDeadline.setDate(exchangeDeadline.getDate() + 28);
    
    const today = new Date();
    const diffTime = exchangeDeadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

// Get status information
function getStatusInfo(status) {
    const statusMap = {
        'pending-signatures': { label: 'Pending Signatures', color: 'warning' },
        'fully-signed': { label: 'Fully Signed', color: 'success' },
        'solicitor-instructed': { label: 'Solicitor Instructed', color: 'success' },
        'searches-ordered': { label: 'Searches Ordered', color: 'success' },
        'exchanged': { label: 'Exchanged', color: 'success' },
        'completed': { label: 'Completed', color: 'success' },
        'pending-payment': { label: 'Pending Payment', color: 'warning' }
    };
    
    return statusMap[status] || { label: status, color: 'gray' };
}

// Get signature information
function getSignatureInfo(reservation) {
    if (reservation.signatures?.method === 'docusign') {
        // Check DocuSign status
        const envelope = JSON.parse(localStorage.getItem('nhp_docusign_envelope') || '{}');
        
        if (envelope.status === 'completed') {
            return {
                icon: '✅',
                text: `${reservation.buyers?.length || 1}/${reservation.buyers?.length || 1} signed`
            };
        } else {
            // Simulate partial signatures
            const totalBuyers = reservation.buyers?.length || 1;
            const signed = Math.floor(Math.random() * totalBuyers);
            return {
                icon: signed > 0 ? '🔄' : '⏳',
                text: `${signed}/${totalBuyers} signed`
            };
        }
    } else {
        // Canvas signatures
        return {
            icon: '✅',
            text: 'All signed'
        };
    }
}

// Filter reservations
function filterReservations() {
    const statusFilter = document.getElementById('filterStatus').value;
    const developmentFilter = document.getElementById('filterDevelopment').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    filteredReservations = allReservations.filter(reservation => {
        const matchesStatus = !statusFilter || reservation.status === statusFilter;
        const matchesDevelopment = !developmentFilter || reservation.plot?.development === developmentFilter;
        const matchesSearch = !searchTerm || 
            reservation.reservationId.toLowerCase().includes(searchTerm) ||
            reservation.plot?.number.toLowerCase().includes(searchTerm) ||
            reservation.buyers?.some(b => b.name.toLowerCase().includes(searchTerm));

        return matchesStatus && matchesDevelopment && matchesSearch;
    });

    renderReservationsTable();
}

// View reservation details
function viewReservationDetails(reservationId) {
    const reservation = allReservations.find(r => r.reservationId === reservationId);
    if (!reservation) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <div>
                    <h2>Reservation Details</h2>
                    <div style="font-size: 0.875rem; color: var(--gray-600); font-family: monospace;">${reservationId}</div>
                </div>
                <button onclick="this.closest('.modal-overlay').remove()" class="modal-close">×</button>
            </div>
            
            <div class="modal-body">
                <!-- Status & Timeline -->
                <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="font-weight: 600;">Current Status</h3>
                        ${getStatusBadge(reservation.status)}
                    </div>
                    <div style="font-size: 0.875rem; color: var(--gray-700);">
                        Reserved: ${new Date(reservation.reservationDate).toLocaleString('en-GB')}
                    </div>
                    <div style="margin-top: 1rem;">
                        <label class="form-label">Update Status:</label>
                        <select id="updateStatus" class="form-input" onchange="updateReservationStatus('${reservationId}', this.value)">
                            <option value="pending-signatures" ${reservation.status === 'pending-signatures' ? 'selected' : ''}>Pending Signatures</option>
                            <option value="fully-signed" ${reservation.status === 'fully-signed' ? 'selected' : ''}>Fully Signed</option>
                            <option value="solicitor-instructed" ${reservation.status === 'solicitor-instructed' ? 'selected' : ''}>Solicitor Instructed</option>
                            <option value="searches-ordered" ${reservation.status === 'searches-ordered' ? 'selected' : ''}>Searches Ordered</option>
                            <option value="exchanged" ${reservation.status === 'exchanged' ? 'selected' : ''}>Exchanged</option>
                            <option value="completed" ${reservation.status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </div>
                </div>

                <!-- Property Details -->
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-weight: 600; margin-bottom: 1rem;">Property Details</h3>
                    <div style="background: white; border: 1px solid var(--gray-200); border-radius: 8px; padding: 1rem;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                            <div>
                                <div style="font-size: 0.75rem; color: var(--gray-600); margin-bottom: 0.25rem;">Plot</div>
                                <div style="font-weight: 600;">${reservation.plot?.number || 'N/A'}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: var(--gray-600); margin-bottom: 0.25rem;">Development</div>
                                <div style="font-weight: 600;">${reservation.plot?.development || 'N/A'}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: var(--gray-600); margin-bottom: 0.25rem;">Property Type</div>
                                <div style="font-weight: 600;">${reservation.plot?.type || 'N/A'}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.75rem; color: var(--gray-600); margin-bottom: 0.25rem;">Purchase Price</div>
                                <div style="font-weight: 600; color: var(--primary-red);">£${(reservation.plot?.price || 0).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Buyers -->
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-weight: 600; margin-bottom: 1rem;">Buyers (${reservation.buyers?.length || 0})</h3>
                    ${(reservation.buyers || []).map((buyer, index) => `
                        <div style="background: white; border: 1px solid var(--gray-200); border-radius: 8px; padding: 1rem; margin-bottom: 0.5rem;">
                            <div style="display: flex; justify-content: between; align-items: start;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; margin-bottom: 0.25rem;">${buyer.name}</div>
                                    <div style="font-size: 0.875rem; color: var(--gray-600);">${buyer.email}</div>
                                    ${buyer.role === 'primary' ? '<div style="font-size: 0.75rem; color: var(--primary-red); margin-top: 0.25rem;">Primary Buyer</div>' : ''}
                                </div>
                                ${reservation.signatures?.method === 'docusign' ? `
                                    <div style="font-size: 0.875rem;">
                                        ${buyer.signed ? '✅ Signed' : '⏳ Pending'}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Signed Documents -->
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="font-weight: 600; margin-bottom: 1rem;">Signed Documents</h3>
                    <div style="background: white; border: 1px solid var(--gray-200); border-radius: 8px; padding: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                            <div>
                                <div style="font-weight: 600;">Reservation Agreement</div>
                                <div style="font-size: 0.75rem; color: var(--gray-600);">
                                    ${reservation.signatures?.method === 'docusign' ? 'DocuSign e-signature' : 'Canvas signature'}
                                    ${reservation.customTCs ? ' • Custom T&Cs' : ' • Platform Standard T&Cs'}
                                </div>
                            </div>
                            <button onclick="downloadSignedDocuments('${reservationId}')" class="btn btn-secondary btn-small">
                                ⬇️ Download
                            </button>
                        </div>
                        ${reservation.signatures?.method === 'docusign' && reservation.docuSignEnvelopeId ? `
                            <div style="font-size: 0.75rem; color: var(--gray-600); font-family: monospace;">
                                Envelope ID: ${reservation.docuSignEnvelopeId}
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Payment Info -->
                ${reservation.payment ? `
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="font-weight: 600; margin-bottom: 1rem;">Payment Details</h3>
                        <div style="background: white; border: 1px solid var(--gray-200); border-radius: 8px; padding: 1rem;">
                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                                <div>
                                    <div style="font-size: 0.75rem; color: var(--gray-600); margin-bottom: 0.25rem;">Amount Paid</div>
                                    <div style="font-weight: 600;">£${(reservation.payment.grossAmount || 0).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div style="font-size: 0.75rem; color: var(--gray-600); margin-bottom: 0.25rem;">Payment Method</div>
                                    <div style="font-weight: 600;">${reservation.payment.paymentMethod || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="modal-footer">
                <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-secondary">Close</button>
                <button onclick="sendToSolicitors('${reservationId}')" class="btn btn-primary">📧 Send to Solicitors</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Get status badge HTML
function getStatusBadge(status) {
    const info = getStatusInfo(status);
    return `<span class="status-badge status-${info.color}">${info.label}</span>`;
}

// Update reservation status
function updateReservationStatus(reservationId, newStatus) {
    const reservations = JSON.parse(localStorage.getItem('nhp_reservations') || '[]');
    const index = reservations.findIndex(r => r.reservationId === reservationId);
    
    if (index !== -1) {
        reservations[index].status = newStatus;
        reservations[index].statusUpdated = new Date().toISOString();
        
        localStorage.setItem('nhp_reservations', JSON.stringify(reservations));
        
        // Reload data
        loadReservations();
        
        showNotification(`Status updated to: ${getStatusInfo(newStatus).label}`, 'success');
        
        // Send notification email (simulated)
        sendStatusUpdateEmail(reservations[index], newStatus);
    }
}

// Download signed documents
function downloadSignedDocuments(reservationId) {
    const reservation = allReservations.find(r => r.reservationId === reservationId);
    if (!reservation) return;

    showNotification('Preparing signed documents for download...', 'info');

    // In production, this would:
    // 1. Fetch signed PDF from DocuSign API or generate from canvas signatures
    // 2. Bundle with property pack
    // 3. Create ZIP file
    // 4. Trigger download

    setTimeout(() => {
        // Simulate download
        const documentsPackage = {
            reservationId: reservation.reservationId,
            plot: reservation.plot,
            buyers: reservation.buyers,
            signedAgreement: reservation.signatures,
            propertyPack: {
                title: 'Property Information Pack',
                documents: [
                    'Title Register',
                    'Title Plan',
                    'Local Authority Searches',
                    'Environmental Search',
                    'Water & Drainage Search',
                    'Signed Reservation Agreement'
                ]
            },
            generatedDate: new Date().toISOString()
        };

        console.log('Documents Package:', documentsPackage);
        showNotification('Signed documents downloaded successfully', 'success');
    }, 1500);
}

// Send documents to solicitors
function sendToSolicitors(reservationId) {
    const reservation = allReservations.find(r => r.reservationId === reservationId);
    if (!reservation) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>Send to Solicitors</h2>
                <button onclick="this.closest('.modal-overlay').remove()" class="modal-close">×</button>
            </div>
            
            <div class="modal-body">
                <p style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 1.5rem;">
                    Send the complete property pack and signed reservation agreement to all solicitors involved in this transaction.
                </p>

                <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <h4 style="font-weight: 600; margin-bottom: 1rem; font-size: 0.875rem;">Recipients:</h4>
                    
                    <!-- Buyer's Solicitor -->
                    <div style="background: white; padding: 1rem; border-radius: 6px; margin-bottom: 0.75rem;">
                        <div style="font-weight: 600; margin-bottom: 0.25rem;">Buyer's Solicitor</div>
                        <div style="font-size: 0.875rem; color: var(--gray-600);">
                            ${reservation.solicitorFirm || reservation.ownSolicitorFirm || 'Not yet instructed'}
                        </div>
                        ${reservation.solicitorEmail || reservation.ownSolicitorEmail ? 
                            `<div style="font-size: 0.75rem; color: var(--gray-500); margin-top: 0.25rem;">${reservation.solicitorEmail || reservation.ownSolicitorEmail}</div>` : 
                            '<div style="font-size: 0.75rem; color: var(--error-red); margin-top: 0.25rem;">⚠️ No email on file</div>'
                        }
                    </div>

                    <!-- Developer's Solicitor -->
                    <div style="background: white; padding: 1rem; border-radius: 6px;">
                        <div style="font-weight: 600; margin-bottom: 0.25rem;">Developer's Solicitor</div>
                        <div style="font-size: 0.875rem; color: var(--gray-600);">Smith & Partners LLP</div>
                        <div style="font-size: 0.75rem; color: var(--gray-500); margin-top: 0.25rem;">conveyancing@smithpartners.com</div>
                    </div>
                </div>

                <div style="background: white; border: 1px solid var(--gray-200); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <h4 style="font-weight: 600; margin-bottom: 1rem; font-size: 0.875rem;">Documents to Send:</h4>
                    <ul style="font-size: 0.875rem; line-height: 1.8; margin: 0; padding-left: 1.5rem;">
                        <li>✅ Signed Reservation Agreement (${reservation.signatures?.method === 'docusign' ? 'DocuSign' : 'Canvas'})</li>
                        <li>✅ Property Information Pack</li>
                        <li>✅ Title Register & Plan</li>
                        <li>✅ Buyer Details & Contact Information</li>
                        <li>✅ Payment Confirmation</li>
                        ${reservation.mortgageOffer ? '<li>✅ Mortgage Offer</li>' : ''}
                    </ul>
                </div>

                <div class="form-group">
                    <label class="form-label">Additional Message (Optional)</label>
                    <textarea id="solicitorMessage" class="form-input" rows="3" placeholder="Add any additional notes for the solicitors..."></textarea>
                </div>
            </div>
            
            <div class="modal-footer">
                <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-secondary">Cancel</button>
                <button onclick="confirmSendToSolicitors('${reservationId}')" class="btn btn-primary">📧 Send Documents</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Confirm and send to solicitors
function confirmSendToSolicitors(reservationId) {
    const message = document.getElementById('solicitorMessage').value;
    const modal = document.querySelector('.modal-overlay');
    
    modal.remove();
    
    showNotification('Sending documents to solicitors...', 'info');

    // In production, this would:
    // 1. Generate complete property pack PDF
    // 2. Attach signed reservation agreement
    // 3. Send via email API (SendGrid, Mailgun, etc.)
    // 4. Log the communication
    
    setTimeout(() => {
        // Simulate email sent
        const emailLog = {
            reservationId: reservationId,
            sentDate: new Date().toISOString(),
            recipients: [
                'Buyer\'s Solicitor',
                'Developer\'s Solicitor'
            ],
            documents: [
                'Signed Reservation Agreement',
                'Property Information Pack',
                'Title Documents',
                'Buyer Details'
            ],
            message: message,
            status: 'sent'
        };

        console.log('Email sent:', emailLog);
        
        // Update reservation with sent status
        const reservations = JSON.parse(localStorage.getItem('nhp_reservations') || '[]');
        const index = reservations.findIndex(r => r.reservationId === reservationId);
        if (index !== -1) {
            if (!reservations[index].solicitorEmails) {
                reservations[index].solicitorEmails = [];
            }
            reservations[index].solicitorEmails.push(emailLog);
            localStorage.setItem('nhp_reservations', JSON.stringify(reservations));
        }

        showNotification('Documents sent successfully to all solicitors', 'success');
    }, 2000);
}

// Send status update email
function sendStatusUpdateEmail(reservation, newStatus) {
    // In production, send email to buyer
    console.log('Status update email sent:', {
        to: reservation.buyers?.[0]?.email,
        subject: `Reservation Status Update: ${reservation.plot?.number}`,
        status: newStatus
    });
}

// Export all reservations
function exportReservations() {
    showNotification('Exporting reservations...', 'info');

    // Create CSV
    const headers = ['Reservation ID', 'Plot', 'Development', 'Buyer Name', 'Buyer Email', 'Reserved Date', 'Status', 'Purchase Price', 'Days to Exchange'];
    
    const rows = allReservations.map(r => [
        r.reservationId,
        r.plot?.number || '',
        r.plot?.development || '',
        r.buyers?.[0]?.name || '',
        r.buyers?.[0]?.email || '',
        new Date(r.reservationDate).toLocaleDateString('en-GB'),
        getStatusInfo(r.status).label,
        r.plot?.price || 0,
        calculateDaysToExchange(new Date(r.reservationDate))
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    // Trigger download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showNotification('Reservations exported successfully', 'success');
}

// Send bulk notifications
function sendBulkNotifications() {
    showNotification('Sending notifications to all buyers with pending actions...', 'info');
    
    // In production, this would send reminder emails
    setTimeout(() => {
        showNotification('Notifications sent successfully', 'success');
    }, 1500);
}

// Utility: Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
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
