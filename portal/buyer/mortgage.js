// Mortgage page controller
const mortgageService = new MortgageOfferService();
let connectedOffers = [];
let connectedDIPs = [];

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuthWithRole('buyer');
    loadCurrentUser();
    loadConnectedOffers();
    checkForOfferUpdates();
    
    // Check for updates every 5 minutes
    setInterval(checkForOfferUpdates, 5 * 60 * 1000);
});

// Load current user info
function loadCurrentUser() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.name || user.email;
    }
}

// Load all connected mortgage offers
async function loadConnectedOffers() {
    try {
        // Get stored connections
        const connections = JSON.parse(localStorage.getItem('nhp_mortgage_connections') || '[]');
        
        // Fetch offers for each connection
        for (const connection of connections) {
            if (connection.type === 'offer') {
                const offer = await mortgageService.fetchMortgageOffer({
                    provider: connection.provider,
                    caseReference: connection.caseReference,
                    applicationId: connection.applicationId
                });
                
                if (offer) {
                    connectedOffers.push(offer);
                }
            } else if (connection.type === 'dip') {
                const dip = await mortgageService.fetchDIP({
                    provider: connection.provider,
                    applicationId: connection.applicationId
                });
                
                if (dip) {
                    connectedDIPs.push(dip);
                }
            }
        }
        
        renderOffers();
    } catch (error) {
        console.error('Error loading offers:', error);
        showNotification('Error loading mortgage offers', 'error');
    }
}

// Render all offers and DIPs
function renderOffers() {
    const container = document.getElementById('offersContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (connectedOffers.length === 0 && connectedDIPs.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    let html = '';
    
    // Render Mortgage Offers
    if (connectedOffers.length > 0) {
        html += `
            <div class="section-header" style="margin-bottom: 1.5rem;">
                <h2 style="font-size: 1.25rem; font-weight: 700;">Mortgage Offers</h2>
                <p style="color: var(--gray-600); font-size: 0.875rem;">Full mortgage offers approved by your lender</p>
            </div>
        `;
        
        connectedOffers.forEach(offer => {
            html += renderOfferCard(offer);
        });
    }
    
    // Render DIPs
    if (connectedDIPs.length > 0) {
        html += `
            <div class="section-header" style="margin-top: 2rem; margin-bottom: 1.5rem;">
                <h2 style="font-size: 1.25rem; font-weight: 700;">Decisions in Principle</h2>
                <p style="color: var(--gray-600); font-size: 0.875rem;">Preliminary mortgage approvals</p>
            </div>
        `;
        
        connectedDIPs.forEach(dip => {
            html += renderDIPCard(dip);
        });
    }
    
    container.innerHTML = html;
}

// Render individual mortgage offer card
function renderOfferCard(offer) {
    const statusColors = {
        'approved': 'success',
        'pending': 'warning',
        'expired': 'error',
        'withdrawn': 'error'
    };
    
    const statusColor = statusColors[offer.status] || 'gray';
    const expiryDate = new Date(offer.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = daysUntilExpiry <= 14 && daysUntilExpiry > 0;
    
    return `
        <div class="card mortgage-offer-card" style="margin-bottom: 1.5rem;">
            <div class="offer-header">
                <div>
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                        <h3 style="font-size: 1.25rem; font-weight: 700; margin: 0;">${offer.lender}</h3>
                        <span class="status-badge status-${statusColor}">
                            ${offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                        </span>
                        ${isExpiringSoon ? `<span class="status-badge status-warning">Expires in ${daysUntilExpiry} days</span>` : ''}
                    </div>
                    <div style="color: var(--gray-600); font-size: 0.875rem;">
                        ${offer.productName} • Ref: ${offer.caseReference}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 2rem; font-weight: 800; color: var(--primary-red);">
                        £${offer.loanAmount.toLocaleString()}
                    </div>
                    <div style="font-size: 0.875rem; color: var(--gray-600);">
                        ${offer.interestRate}% ${offer.rateType}
                    </div>
                </div>
            </div>
            
            <div class="offer-details-grid">
                <div class="detail-item">
                    <div class="detail-label">Monthly Payment</div>
                    <div class="detail-value">£${offer.monthlyPayment.toLocaleString()}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Term</div>
                    <div class="detail-value">${offer.term} years</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">LTV</div>
                    <div class="detail-value">${offer.ltv}%</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Property Value</div>
                    <div class="detail-value">£${offer.propertyValue.toLocaleString()}</div>
                </div>
            </div>
            
            ${offer.conditions && offer.conditions.length > 0 ? `
                <div class="offer-conditions">
                    <div style="font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem;">Conditions:</div>
                    <ul style="margin: 0; padding-left: 1.5rem; font-size: 0.875rem; color: var(--gray-700);">
                        ${offer.conditions.map(c => `<li>${c}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <div class="offer-actions">
                <button onclick="viewOfferDetails('${offer.offerId}')" class="btn btn-secondary">
                    📄 View Full Details
                </button>
                <button onclick="downloadOffer('${offer.offerId}', 'offer')" class="btn btn-secondary">
                    ⬇️ Download Offer
                </button>
                <button onclick="useForReservation('${offer.offerId}')" class="btn btn-primary">
                    ✅ Use for Reservation
                </button>
            </div>
            
            <div class="offer-footer">
                <div style="font-size: 0.75rem; color: var(--gray-500);">
                    Last updated: ${new Date(offer.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div style="font-size: 0.75rem; color: ${isExpiringSoon ? 'var(--error-red)' : 'var(--gray-500)'};">
                    Expires: ${expiryDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
            </div>
        </div>
    `;
}

// Render DIP card
function renderDIPCard(dip) {
    const statusColors = {
        'approved': 'success',
        'pending': 'warning',
        'declined': 'error'
    };
    
    const statusColor = statusColors[dip.status] || 'gray';
    
    return `
        <div class="card mortgage-dip-card" style="margin-bottom: 1.5rem; border-left: 4px solid var(--success-green);">
            <div class="offer-header">
                <div>
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                        <h3 style="font-size: 1.125rem; font-weight: 700; margin: 0;">${dip.lender}</h3>
                        <span class="status-badge status-${statusColor}">
                            ${dip.status.charAt(0).toUpperCase() + dip.status.slice(1)}
                        </span>
                    </div>
                    <div style="color: var(--gray-600); font-size: 0.875rem;">
                        Decision in Principle • Ref: ${dip.referenceNumber}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.5rem; font-weight: 700; color: var(--success-green);">
                        £${dip.maxLoanAmount.toLocaleString()}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--gray-600);">
                        Maximum loan amount
                    </div>
                </div>
            </div>
            
            <div class="offer-details-grid" style="grid-template-columns: repeat(2, 1fr);">
                <div class="detail-item">
                    <div class="detail-label">Valid Until</div>
                    <div class="detail-value">${new Date(dip.validUntil).toLocaleDateString('en-GB')}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Issued</div>
                    <div class="detail-value">${new Date(dip.issueDate).toLocaleDateString('en-GB')}</div>
                </div>
            </div>
            
            <div class="offer-actions">
                <button onclick="downloadOffer('${dip.dipId}', 'dip')" class="btn btn-secondary">
                    ⬇️ Download DIP
                </button>
                <button onclick="convertToFullOffer('${dip.dipId}')" class="btn btn-primary">
                    ➡️ Convert to Full Offer
                </button>
            </div>
        </div>
    `;
}

// Show connect lender modal
function showConnectModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>Connect Your Lender</h2>
                <button onclick="this.closest('.modal-overlay').remove()" class="modal-close">×</button>
            </div>
            
            <div class="modal-body">
                <div style="margin-bottom: 2rem;">
                    <label class="form-label">Select Connection Type</label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem;">
                        <button onclick="selectConnectionType('lms')" class="connection-type-btn" id="type-lms">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📊</div>
                            <div style="font-weight: 600;">LMS Lender Exchange</div>
                            <div style="font-size: 0.75rem; color: var(--gray-600); margin-top: 0.25rem;">Multiple lenders</div>
                        </button>
                        <button onclick="selectConnectionType('direct')" class="connection-type-btn" id="type-direct">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏦</div>
                            <div style="font-weight: 600;">Direct Lender</div>
                            <div style="font-size: 0.75rem; color: var(--gray-600); margin-top: 0.25rem;">Single lender</div>
                        </button>
                    </div>
                </div>
                
                <div id="lmsForm" style="display: none;">
                    <div class="form-group">
                        <label class="form-label">LMS Case Reference</label>
                        <input type="text" id="lmsCaseRef" class="form-input" placeholder="Enter your LMS case reference">
                        <div class="form-hint">You can find this in your LMS portal or mortgage broker communications</div>
                    </div>
                </div>
                
                <div id="directForm" style="display: none;">
                    <div class="form-group">
                        <label class="form-label">Select Lender</label>
                        <select id="directLender" class="form-input">
                            <option value="">Choose your lender...</option>
                            <option value="nationwide">Nationwide</option>
                            <option value="hsbc">HSBC UK</option>
                            <option value="santander">Santander</option>
                            <option value="barclays">Barclays</option>
                            <option value="natwest">NatWest</option>
                            <option value="lloyds">Lloyds Bank</option>
                            <option value="halifax">Halifax</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Application/Case Reference</label>
                        <input type="text" id="directAppRef" class="form-input" placeholder="Enter your application reference">
                        <div class="form-hint">Find this in your mortgage application documents or online banking</div>
                    </div>
                </div>
                
                <div style="background: var(--gray-50); padding: 1rem; border-radius: 8px; margin-top: 1.5rem;">
                    <div style="font-size: 0.875rem; color: var(--gray-700);">
                        🔒 <strong>Secure Connection:</strong> We use bank-level encryption to connect to your lender. 
                        We never store your banking credentials and can only access mortgage offer information.
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-secondary">Cancel</button>
                <button onclick="connectLender()" class="btn btn-primary" id="connectBtn" disabled>Connect Lender</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Select connection type
let selectedConnectionType = null;
function selectConnectionType(type) {
    selectedConnectionType = type;
    
    // Update button states
    document.getElementById('type-lms').classList.remove('selected');
    document.getElementById('type-direct').classList.remove('selected');
    document.getElementById(`type-${type}`).classList.add('selected');
    
    // Show/hide forms
    document.getElementById('lmsForm').style.display = type === 'lms' ? 'block' : 'none';
    document.getElementById('directForm').style.display = type === 'direct' ? 'block' : 'none';
    
    // Enable connect button
    document.getElementById('connectBtn').disabled = false;
}

// Connect to lender
async function connectLender() {
    const connectBtn = document.getElementById('connectBtn');
    const originalText = connectBtn.textContent;
    
    try {
        connectBtn.disabled = true;
        connectBtn.textContent = 'Connecting...';
        
        let connection = { type: 'offer' };
        
        if (selectedConnectionType === 'lms') {
            const caseRef = document.getElementById('lmsCaseRef').value.trim();
            if (!caseRef) {
                showNotification('Please enter your LMS case reference', 'error');
                return;
            }
            
            connection.provider = 'lms';
            connection.caseReference = caseRef;
            
            // Test connection
            const offer = await mortgageService.connectToLMS({ caseReference: caseRef });
            if (offer) {
                connectedOffers.push(offer);
            }
            
        } else if (selectedConnectionType === 'direct') {
            const lender = document.getElementById('directLender').value;
            const appRef = document.getElementById('directAppRef').value.trim();
            
            if (!lender || !appRef) {
                showNotification('Please select a lender and enter your application reference', 'error');
                return;
            }
            
            connection.provider = lender;
            connection.applicationId = appRef;
            
            // Test connection
            const offer = await mortgageService.fetchMortgageOffer({
                provider: lender,
                applicationId: appRef
            });
            
            if (offer) {
                connectedOffers.push(offer);
            }
        }
        
        // Store connection
        const connections = JSON.parse(localStorage.getItem('nhp_mortgage_connections') || '[]');
        connections.push(connection);
        localStorage.setItem('nhp_mortgage_connections', JSON.stringify(connections));
        
        // Close modal
        document.querySelector('.modal-overlay').remove();
        
        // Refresh display
        renderOffers();
        
        showNotification('Lender connected successfully! Your mortgage offers are now available.', 'success');
        
    } catch (error) {
        console.error('Connection error:', error);
        showNotification('Failed to connect to lender. Please check your details and try again.', 'error');
    } finally {
        connectBtn.disabled = false;
        connectBtn.textContent = originalText;
    }
}

// View offer details modal
function viewOfferDetails(offerId) {
    const offer = connectedOffers.find(o => o.offerId === offerId);
    if (!offer) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h2>${offer.lender} Mortgage Offer</h2>
                <button onclick="this.closest('.modal-overlay').remove()" class="modal-close">×</button>
            </div>
            
            <div class="modal-body">
                <div class="offer-detail-section">
                    <h3>Loan Details</h3>
                    <div class="detail-grid">
                        <div><span class="detail-label">Loan Amount:</span> £${offer.loanAmount.toLocaleString()}</div>
                        <div><span class="detail-label">Property Value:</span> £${offer.propertyValue.toLocaleString()}</div>
                        <div><span class="detail-label">LTV:</span> ${offer.ltv}%</div>
                        <div><span class="detail-label">Term:</span> ${offer.term} years</div>
                    </div>
                </div>
                
                <div class="offer-detail-section">
                    <h3>Interest & Payments</h3>
                    <div class="detail-grid">
                        <div><span class="detail-label">Interest Rate:</span> ${offer.interestRate}%</div>
                        <div><span class="detail-label">Rate Type:</span> ${offer.rateType}</div>
                        <div><span class="detail-label">Monthly Payment:</span> £${offer.monthlyPayment.toLocaleString()}</div>
                        <div><span class="detail-label">Product:</span> ${offer.productName}</div>
                    </div>
                </div>
                
                <div class="offer-detail-section">
                    <h3>Important Dates</h3>
                    <div class="detail-grid">
                        <div><span class="detail-label">Issue Date:</span> ${new Date(offer.issueDate).toLocaleDateString('en-GB')}</div>
                        <div><span class="detail-label">Expiry Date:</span> ${new Date(offer.expiryDate).toLocaleDateString('en-GB')}</div>
                    </div>
                </div>
                
                ${offer.conditions && offer.conditions.length > 0 ? `
                    <div class="offer-detail-section">
                        <h3>Conditions</h3>
                        <ul style="margin: 0; padding-left: 1.5rem;">
                            ${offer.conditions.map(c => `<li>${c}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                <div class="offer-detail-section">
                    <h3>Reference Information</h3>
                    <div class="detail-grid">
                        <div><span class="detail-label">Case Reference:</span> ${offer.caseReference}</div>
                        <div><span class="detail-label">Offer ID:</span> ${offer.offerId}</div>
                        <div><span class="detail-label">Status:</span> <span class="status-badge status-${offer.status === 'approved' ? 'success' : 'warning'}">${offer.status}</span></div>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <button onclick="downloadOffer('${offerId}', 'offer')" class="btn btn-secondary">⬇️ Download Offer</button>
                <button onclick="this.closest('.modal-overlay').remove(); useForReservation('${offerId}')" class="btn btn-primary">Use for Reservation</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Download offer document
async function downloadOffer(id, type) {
    try {
        showNotification('Downloading document...', 'info');
        
        const result = await mortgageService.downloadOfferDocument(id, type);
        
        if (result.success) {
            // In production, this would trigger actual file download
            // For MVP, we'll show success message
            showNotification(`${type === 'offer' ? 'Mortgage offer' : 'DIP'} downloaded successfully`, 'success');
        } else {
            showNotification('Download failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Download failed. Please try again.', 'error');
    }
}

// Use offer for reservation
function useForReservation(offerId) {
    const offer = connectedOffers.find(o => o.offerId === offerId);
    if (!offer) return;
    
    // Store selected offer for reservation flow
    localStorage.setItem('nhp_selected_mortgage_offer', JSON.stringify(offer));
    
    showNotification('Mortgage offer selected! You can now proceed with your reservation.', 'success');
    
    // Redirect to plots page or resume reservation
    const savedPlot = localStorage.getItem('nhp_selected_plot');
    if (savedPlot) {
        window.location.href = 'reserve.html';
    } else {
        window.location.href = '../../plots.html';
    }
}

// Convert DIP to full offer
function convertToFullOffer(dipId) {
    showNotification('Contact your mortgage broker to convert your DIP to a full mortgage offer', 'info');
}

// Check for offer updates
async function checkForOfferUpdates() {
    try {
        const connections = JSON.parse(localStorage.getItem('nhp_mortgage_connections') || '[]');
        
        for (const connection of connections) {
            const updates = await mortgageService.checkForUpdates(
                connection.caseReference || connection.applicationId
            );
            
            if (updates.hasUpdates) {
                showNotification(`Updates available for your ${connection.provider} mortgage offer`, 'info');
                loadConnectedOffers(); // Reload offers
                break;
            }
        }
    } catch (error) {
        console.error('Error checking updates:', error);
    }
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
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}
