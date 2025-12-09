// Agreement & Signature Logic

let buyers = []; // Array to store all buyers
let signaturePads = {}; // Object to store signature pad instances
let selectedSignatureMethod = 'docusign'; // Default to DocuSign
let customTCsLoaded = false;

// Initialize agreement section when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadDeveloperTCs();
    updateBuyersList();
});

// Add a new buyer (up to 4 total)
function addBuyer() {
    if (buyers.length >= 4) {
        showNotification('Maximum of 4 buyers allowed', 'error');
        return;
    }

    const buyerNumber = buyers.length + 1;
    
    // Show modal to collect buyer details
    showAddBuyerModal(buyerNumber);
}

// Show modal to add buyer details
function showAddBuyerModal(buyerNumber) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>Add Buyer ${buyerNumber}</h2>
                <button onclick="this.closest('.modal-overlay').remove()" class="modal-close">×</button>
            </div>
            
            <div class="modal-body">
                <p style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 1.5rem;">
                    Enter the details for buyer ${buyerNumber}. They will need to sign the agreement.
                </p>

                <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <input type="text" id="newBuyerName" class="form-input" placeholder="e.g. Jane Smith" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Email Address *</label>
                    <input type="email" id="newBuyerEmail" class="form-input" placeholder="jane.smith@email.com" required>
                    <p style="font-size: 0.75rem; color: var(--gray-600); margin-top: 0.5rem;">
                        ${selectedSignatureMethod === 'docusign' ? 'DocuSign invitation will be sent to this email' : 'Used for verification purposes'}
                    </p>
                </div>

                <div class="form-group">
                    <label class="form-label">Phone Number *</label>
                    <input type="tel" id="newBuyerPhone" class="form-input" placeholder="+44 7123 456789" required>
                </div>
            </div>
            
            <div class="modal-footer">
                <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-secondary">Cancel</button>
                <button onclick="saveBuyer(${buyerNumber})" class="btn btn-primary">Add Buyer</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Save new buyer
function saveBuyer(buyerNumber) {
    const name = document.getElementById('newBuyerName').value.trim();
    const email = document.getElementById('newBuyerEmail').value.trim();
    const phone = document.getElementById('newBuyerPhone').value.trim();

    if (!name || !email || !phone) {
        showNotification('Please fill in all buyer details', 'error');
        return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    buyers.push({
        number: buyerNumber,
        name: name,
        email: email,
        phone: phone,
        signed: false
    });

    // Close modal
    document.querySelector('.modal-overlay').remove();

    // Update UI
    updateBuyersList();
    updateDocuSignBuyersList();
    updateCanvasSignatures();

    showNotification(`Buyer ${buyerNumber} added successfully`, 'success');

    // Hide add button if 4 buyers reached
    if (buyers.length >= 3) { // 3 additional + 1 primary = 4 total
        document.getElementById('addBuyerBtn').style.display = 'none';
    }
}

// Remove a buyer
function removeBuyer(buyerNumber) {
    if (confirm(`Remove buyer ${buyerNumber}?`)) {
        buyers = buyers.filter(b => b.number !== buyerNumber);
        
        // Renumber remaining buyers
        buyers.forEach((buyer, index) => {
            buyer.number = index + 2; // Start from 2 (buyer 1 is primary)
        });

        updateBuyersList();
        updateDocuSignBuyersList();
        updateCanvasSignatures();

        // Show add button again if under 4 buyers
        if (buyers.length < 3) {
            document.getElementById('addBuyerBtn').style.display = 'block';
        }

        showNotification('Buyer removed', 'success');
    }
}

// Update buyers list display
function updateBuyersList() {
    const container = document.getElementById('buyersContainer');
    
    // Get primary buyer info from form
    const primaryName = document.getElementById('firstName')?.value + ' ' + document.getElementById('lastName')?.value;
    const primaryEmail = document.getElementById('email')?.value;

    // Update buyer 1 (primary)
    if (document.getElementById('buyer1Name')) {
        document.getElementById('buyer1Name').textContent = primaryName || 'Not provided';
        document.getElementById('buyer1Email').textContent = primaryEmail || 'Not provided';
    }

    // Remove existing additional buyers
    const existingAdditional = container.querySelectorAll('.buyer-entry[data-buyer]:not([data-buyer="1"])');
    existingAdditional.forEach(el => el.remove());

    // Add additional buyers
    buyers.forEach(buyer => {
        const buyerHTML = `
            <div class="buyer-entry" data-buyer="${buyer.number}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h4 style="font-weight: 600; color: var(--primary-red);">Buyer ${buyer.number}</h4>
                    <button type="button" onclick="removeBuyer(${buyer.number})" class="btn btn-secondary btn-small">Remove</button>
                </div>
                <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid var(--gray-200);">
                    <div style="font-weight: 600; margin-bottom: 0.25rem;">${buyer.name}</div>
                    <div style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 0.25rem;">${buyer.email}</div>
                    <div style="font-size: 0.75rem; color: var(--gray-500);">${buyer.phone}</div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', buyerHTML);
    });
}

// Update DocuSign buyers list
function updateDocuSignBuyersList() {
    const container = document.getElementById('docuSignBuyersList');
    if (!container) return;

    const primaryName = document.getElementById('firstName')?.value + ' ' + document.getElementById('lastName')?.value;
    const primaryEmail = document.getElementById('email')?.value;

    let html = `
        <div class="docusign-buyer-item">
            <div class="buyer-icon">1</div>
            <div class="buyer-info">
                <div class="buyer-name">${primaryName || 'Primary Buyer'}</div>
                <div class="buyer-email">${primaryEmail || 'No email'}</div>
            </div>
            <div style="font-size: 0.75rem; color: var(--gray-500);">Primary</div>
        </div>
    `;

    buyers.forEach(buyer => {
        html += `
            <div class="docusign-buyer-item">
                <div class="buyer-icon">${buyer.number}</div>
                <div class="buyer-info">
                    <div class="buyer-name">${buyer.name}</div>
                    <div class="buyer-email">${buyer.email}</div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Update canvas signature pads for all buyers
function updateCanvasSignatures() {
    const container = document.getElementById('canvasSignaturesContainer');
    if (!container) return;

    const primaryName = document.getElementById('firstName')?.value + ' ' + document.getElementById('lastName')?.value;

    let html = `
        <div style="margin-bottom: 2rem;">
            <label class="form-label">Buyer 1 - ${primaryName || 'Primary Buyer'} *</label>
            <div class="canvas-signature-pad">
                <canvas id="signatureCanvas1" width="600" height="150"></canvas>
            </div>
            <button type="button" class="btn btn-secondary btn-small" onclick="clearCanvasSignature(1)">Clear Signature</button>
        </div>
    `;

    buyers.forEach(buyer => {
        html += `
            <div style="margin-bottom: 2rem;">
                <label class="form-label">Buyer ${buyer.number} - ${buyer.name} *</label>
                <div class="canvas-signature-pad">
                    <canvas id="signatureCanvas${buyer.number}" width="600" height="150"></canvas>
                </div>
                <button type="button" class="btn btn-secondary btn-small" onclick="clearCanvasSignature(${buyer.number})">Clear Signature</button>
            </div>
        `;
    });

    container.innerHTML = html;

    // Initialize signature pads
    initializeAllSignaturePads();
}

// Initialize all signature pads
function initializeAllSignaturePads() {
    signaturePads = {}; // Reset

    // Initialize pad for buyer 1 (primary)
    const canvas1 = document.getElementById('signatureCanvas1');
    if (canvas1) {
        signaturePads[1] = new SignaturePad(canvas1, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(0, 0, 0)'
        });
    }

    // Initialize pads for additional buyers
    buyers.forEach(buyer => {
        const canvas = document.getElementById(`signatureCanvas${buyer.number}`);
        if (canvas) {
            signaturePads[buyer.number] = new SignaturePad(canvas, {
                backgroundColor: 'rgb(255, 255, 255)',
                penColor: 'rgb(0, 0, 0)'
            });
        }
    });
}

// Clear a specific canvas signature
function clearCanvasSignature(buyerNumber) {
    if (signaturePads[buyerNumber]) {
        signaturePads[buyerNumber].clear();
    }
}

// Select signature method
function selectSignatureMethod(method) {
    selectedSignatureMethod = method;

    // Update UI
    document.getElementById('methodDocuSign').classList.remove('selected');
    document.getElementById('methodCanvas').classList.remove('selected');
    document.getElementById(`method${method === 'docusign' ? 'DocuSign' : 'Canvas'}`).classList.add('selected');

    // Show/hide sections
    document.getElementById('docuSignSection').style.display = method === 'docusign' ? 'block' : 'none';
    document.getElementById('canvasSignatureSection').style.display = method === 'canvas' ? 'block' : 'none';

    // Update submit button text
    const submitText = method === 'docusign' ? 'Send for DocuSign' : 'Complete Reservation';
    document.getElementById('submitButtonText').textContent = submitText;

    // Initialize canvas signatures if switched to canvas
    if (method === 'canvas') {
        updateCanvasSignatures();
    }
}

// Load developer's custom T&Cs or use platform standard
function loadDeveloperTCs() {
    // In production, this would fetch from API
    // Check if developer has uploaded custom T&Cs
    const developerTCs = localStorage.getItem('nhp_developer_custom_tcs');

    if (developerTCs) {
        try {
            const tcData = JSON.parse(developerTCs);
            
            // Show custom T&Cs
            document.getElementById('standardTCs').style.display = 'none';
            document.getElementById('customTCs').style.display = 'block';
            document.getElementById('customTCContent').innerHTML = tcData.content;
            document.getElementById('tcSourceBadge').textContent = 'Developer Custom';
            document.getElementById('tcSourceBadge').style.background = 'var(--primary-red)';
            document.getElementById('tcSourceBadge').style.color = 'white';
            document.getElementById('tcLastUpdated').textContent = tcData.lastUpdated;
            
            customTCsLoaded = true;
        } catch (error) {
            console.error('Error loading custom T&Cs:', error);
            // Fall back to standard
            useStandardTCs();
        }
    } else {
        useStandardTCs();
    }
}

// Use platform standard T&Cs
function useStandardTCs() {
    document.getElementById('standardTCs').style.display = 'block';
    document.getElementById('customTCs').style.display = 'none';
    document.getElementById('tcSourceBadge').textContent = 'Platform Standard';
    document.getElementById('tcSourceBadge').style.background = 'var(--gray-200)';
    document.getElementById('tcSourceBadge').style.color = 'var(--primary-black)';
    customTCsLoaded = false;
}

// Download T&Cs as PDF
function downloadTCs() {
    // In production, this would generate actual PDF
    showNotification('Downloading Terms & Conditions...', 'info');
    
    // Simulate download
    setTimeout(() => {
        showNotification('T&Cs downloaded successfully', 'success');
    }, 1000);
}

// Validate all signatures before submission
function validateSignatures() {
    if (selectedSignatureMethod === 'docusign') {
        // DocuSign validation - just need checkbox
        return document.getElementById('agreeTerms').checked;
    } else {
        // Canvas validation - check all pads have signatures
        if (!signaturePads[1] || signaturePads[1].isEmpty()) {
            showNotification('Primary buyer signature is required', 'error');
            return false;
        }

        for (const buyer of buyers) {
            if (!signaturePads[buyer.number] || signaturePads[buyer.number].isEmpty()) {
                showNotification(`Buyer ${buyer.number} signature is required`, 'error');
                return false;
            }
        }

        return true;
    }
}

// Get all signatures data
function getAllSignaturesData() {
    if (selectedSignatureMethod === 'docusign') {
        // Return buyer info for DocuSign envelope
        const primaryName = document.getElementById('firstName')?.value + ' ' + document.getElementById('lastName')?.value;
        const primaryEmail = document.getElementById('email')?.value;

        return {
            method: 'docusign',
            buyers: [
                { number: 1, name: primaryName, email: primaryEmail, role: 'primary' },
                ...buyers.map(b => ({ ...b, role: 'additional' }))
            ]
        };
    } else {
        // Return canvas signature data
        const signatures = {
            method: 'canvas',
            signatures: []
        };

        // Get primary buyer signature
        if (signaturePads[1]) {
            signatures.signatures.push({
                buyer: 1,
                name: document.getElementById('firstName')?.value + ' ' + document.getElementById('lastName')?.value,
                signatureData: signaturePads[1].toDataURL()
            });
        }

        // Get additional buyers' signatures
        buyers.forEach(buyer => {
            if (signaturePads[buyer.number]) {
                signatures.signatures.push({
                    buyer: buyer.number,
                    name: buyer.name,
                    signatureData: signaturePads[buyer.number].toDataURL()
                });
            }
        });

        return signatures;
    }
}

// Send to DocuSign
function sendToDocuSign(reservationData) {
    // In production, this would call DocuSign API
    showNotification('Preparing DocuSign envelope...', 'info');

    // Simulate DocuSign envelope creation
    const envelopeData = {
        envelopeId: 'ENV-' + Date.now(),
        status: 'sent',
        createdDate: new Date().toISOString(),
        signers: getAllSignaturesData().buyers,
        documentName: 'Reservation Agreement - ' + reservationData.plot,
        customTCs: customTCsLoaded
    };

    // Store envelope info
    localStorage.setItem('nhp_docusign_envelope', JSON.stringify(envelopeData));

    // Production code would look like this:
    /*
    const docuSignAPI = 'https://demo.docusign.net/restapi/v2.1/accounts/{accountId}/envelopes';
    
    fetch(docuSignAPI, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.DOCUSIGN_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            emailSubject: 'Please sign: New Home Reservation Agreement',
            documents: [{
                documentBase64: base64EncodedPDF,
                name: 'Reservation Agreement',
                fileExtension: 'pdf',
                documentId: '1'
            }],
            recipients: {
                signers: envelopeData.signers.map((signer, index) => ({
                    email: signer.email,
                    name: signer.name,
                    recipientId: String(index + 1),
                    routingOrder: String(index + 1)
                }))
            },
            status: 'sent'
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('DocuSign envelope created:', data.envelopeId);
    });
    */

    return envelopeData;
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
