// Developer Settings Logic

let selectedTCType = 'standard';
let uploadedTCFile = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuthWithRole('developer');
    loadCurrentUser();
    loadSavedSettings();
});

function loadCurrentUser() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.name || user.email;
    }
}

// Load saved settings
function loadSavedSettings() {
    const savedTCs = localStorage.getItem('nhp_developer_custom_tcs');
    const docusignSettings = localStorage.getItem('nhp_docusign_settings');

    if (savedTCs) {
        try {
            const tcData = JSON.parse(savedTCs);
            if (tcData.type === 'custom') {
                selectTCType('custom');
                displayUploadedTC(tcData);
            }
        } catch (error) {
            console.error('Error loading saved T&Cs:', error);
        }
    }

    if (docusignSettings) {
        try {
            const settings = JSON.parse(docusignSettings);
            if (settings.connected) {
                showDocuSignConnected(settings);
            }
        } catch (error) {
            console.error('Error loading DocuSign settings:', error);
        }
    }
}

// Select T&C type
function selectTCType(type) {
    selectedTCType = type;

    // Update UI
    document.getElementById('tcTypeStandard').classList.remove('selected');
    document.getElementById('tcTypeCustom').classList.remove('selected');
    document.getElementById(`tcType${type === 'standard' ? 'Standard' : 'Custom'}`).classList.add('selected');

    // Show/hide sections
    document.getElementById('standardTCSection').style.display = type === 'standard' ? 'block' : 'none';
    document.getElementById('customTCSection').style.display = type === 'custom' ? 'block' : 'none';
}

// Handle T&C file upload
function handleTCFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('File size must be less than 5MB', 'error');
        return;
    }

    // Validate file type
    const validTypes = ['application/pdf', 'text/html', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
        showNotification('Please upload a PDF, HTML, or DOCX file', 'error');
        return;
    }

    uploadedTCFile = file;

    // Read file for preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        displayUploadedTC({
            fileName: file.name,
            fileType: file.type,
            content: file.type === 'text/html' ? content : 'PDF preview not available - file will be used in reservation agreements',
            uploadDate: new Date().toISOString()
        });
    };

    if (file.type === 'text/html') {
        reader.readAsText(file);
    } else {
        reader.readAsDataURL(file);
    }

    showNotification('File uploaded successfully', 'success');
}

// Display uploaded T&C
function displayUploadedTC(tcData) {
    document.getElementById('uploadedTCPreview').style.display = 'block';
    document.getElementById('uploadedFileName').textContent = tcData.fileName || 'Custom Terms & Conditions';
    
    const previewContent = document.getElementById('tcPreviewContent');
    if (tcData.content) {
        previewContent.innerHTML = tcData.fileType === 'text/html' ? 
            tcData.content : 
            `<div style="padding: 2rem; text-align: center; color: var(--gray-600);">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">📄</div>
                <div>PDF document uploaded</div>
                <div style="font-size: 0.875rem; margin-top: 0.5rem;">${tcData.fileName}</div>
            </div>`;
    }

    // Populate review date if saved
    if (tcData.reviewDate) {
        document.getElementById('tcReviewDate').value = tcData.reviewDate;
    }
    if (tcData.solicitorName) {
        document.getElementById('tcSolicitorName').value = tcData.solicitorName;
    }
}

// Remove T&C file
function removeTCFile() {
    if (confirm('Are you sure you want to remove this file?')) {
        uploadedTCFile = null;
        document.getElementById('uploadedTCPreview').style.display = 'none';
        document.getElementById('tcFileInput').value = '';
        showNotification('File removed', 'success');
    }
}

// Save T&C settings
function saveTCSettings() {
    if (selectedTCType === 'custom') {
        if (!uploadedTCFile && !document.getElementById('uploadedTCPreview').style.display !== 'none') {
            showNotification('Please upload a custom T&C document', 'error');
            return;
        }

        const reviewDate = document.getElementById('tcReviewDate').value;
        const solicitorName = document.getElementById('tcSolicitorName').value.trim();

        if (!reviewDate) {
            showNotification('Please provide the last review date', 'error');
            return;
        }

        if (!solicitorName) {
            showNotification('Please provide the solicitor/firm name who reviewed these terms', 'error');
            return;
        }

        // In production, this would upload to server
        const tcData = {
            type: 'custom',
            fileName: uploadedTCFile ? uploadedTCFile.name : 'Custom Terms & Conditions',
            fileType: uploadedTCFile ? uploadedTCFile.type : 'text/html',
            content: document.getElementById('tcPreviewContent').innerHTML,
            reviewDate: reviewDate,
            solicitorName: solicitorName,
            lastUpdated: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
            uploadDate: new Date().toISOString()
        };

        localStorage.setItem('nhp_developer_custom_tcs', JSON.stringify(tcData));
        showNotification('Custom T&Cs saved successfully! These will be used in all reservation agreements.', 'success');
    } else {
        // Remove custom T&Cs, use standard
        localStorage.removeItem('nhp_developer_custom_tcs');
        showNotification('Platform standard T&Cs will be used for reservations', 'success');
    }
}

// Preview T&Cs in reservation form
function previewTCs() {
    showNotification('Opening reservation form preview...', 'info');
    
    // Save current settings first
    saveTCSettings();
    
    // Open reservation form in new tab
    setTimeout(() => {
        window.open('../buyer/reserve.html?plot=1&preview=true', '_blank');
    }, 500);
}

// Connect DocuSign
function connectDocuSign() {
    // Show loading modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>Connect DocuSign</h2>
                <button onclick="this.closest('.modal-overlay').remove()" class="modal-close">×</button>
            </div>
            
            <div class="modal-body">
                <p style="font-size: 0.875rem; color: var(--gray-600); margin-bottom: 1.5rem;">
                    You'll be redirected to DocuSign to authorize access. This allows the platform to send documents for signature on your behalf.
                </p>

                <div style="background: var(--gray-50); padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <h4 style="font-weight: 600; margin-bottom: 1rem; font-size: 0.875rem;">What you'll need:</h4>
                    <ul style="font-size: 0.875rem; line-height: 1.6; color: var(--gray-700); margin: 0;">
                        <li>DocuSign account (free Developer account or paid plan)</li>
                        <li>Account administrator access</li>
                        <li>2-5 minutes to complete authorization</li>
                    </ul>
                </div>

                <div style="background: #FFF9E6; border: 1px solid #F59E0B; padding: 1rem; border-radius: 8px;">
                    <p style="font-size: 0.75rem; color: #92400E; margin: 0;">
                        💡 <strong>Note:</strong> This is a simulation. In production, you would be redirected to DocuSign's OAuth authorization page.
                    </p>
                </div>
            </div>
            
            <div class="modal-footer">
                <button onclick="this.closest('.modal-overlay').remove()" class="btn btn-secondary">Cancel</button>
                <button onclick="simulateDocuSignConnection()" class="btn btn-primary">Continue to DocuSign</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);

    /* Production code would look like this:
    const docusignAuthUrl = 'https://account-d.docusign.com/oauth/auth';
    const clientId = process.env.DOCUSIGN_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/docusign/callback');
    const scope = 'signature impersonation';
    
    window.location.href = `${docusignAuthUrl}?response_type=code&scope=${scope}&client_id=${clientId}&redirect_uri=${redirectUri}`;
    */
}

// Simulate DocuSign connection (for MVP)
function simulateDocuSignConnection() {
    const modal = document.querySelector('.modal-overlay');
    const modalBody = modal.querySelector('.modal-body');
    
    modalBody.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div class="spinner" style="margin: 0 auto 1.5rem; width: 50px; height: 50px; border: 4px solid var(--gray-200); border-top-color: var(--primary-red); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <h3 style="font-weight: 600; margin-bottom: 0.5rem;">Connecting to DocuSign...</h3>
            <p style="font-size: 0.875rem; color: var(--gray-600);">Please wait</p>
        </div>
    `;

    setTimeout(() => {
        const settings = {
            connected: true,
            accountEmail: getCurrentUser()?.email || 'developer@demo.com',
            accountId: 'DS-' + Date.now(),
            connectedDate: new Date().toISOString()
        };

        localStorage.setItem('nhp_docusign_settings', JSON.stringify(settings));
        
        modal.remove();
        showDocuSignConnected(settings);
        showNotification('DocuSign connected successfully!', 'success');
    }, 2000);
}

// Show DocuSign as connected
function showDocuSignConnected(settings) {
    document.getElementById('docusignNotConnected').style.display = 'none';
    document.getElementById('docusignConnected').style.display = 'block';
    document.getElementById('docusignAccountEmail').textContent = settings.accountEmail;
}

// Disconnect DocuSign
function disconnectDocuSign() {
    if (confirm('Are you sure you want to disconnect DocuSign? Buyers will no longer be able to use DocuSign for signatures.')) {
        localStorage.removeItem('nhp_docusign_settings');
        document.getElementById('docusignNotConnected').style.display = 'block';
        document.getElementById('docusignConnected').style.display = 'none';
        showNotification('DocuSign disconnected', 'success');
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
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Add CSS for T&C type cards
const style = document.createElement('style');
style.textContent = `
    .tc-type-card {
        background: white;
        border: 2px solid var(--gray-300);
        border-radius: 12px;
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
        position: relative;
    }

    .tc-type-card:hover {
        border-color: var(--primary-red);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(211, 47, 47, 0.15);
    }

    .tc-type-card.selected {
        border-color: var(--primary-red);
        background: rgba(211, 47, 47, 0.05);
    }

    .tc-check {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--primary-red);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        font-weight: bold;
    }

    .tc-type-card:not(.selected) .tc-check {
        display: none;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
