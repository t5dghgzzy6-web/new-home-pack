// Buyer Document Upload and Management System
// Integrates with GDPR-compliant document storage

// Required documents for property purchase
// Note: ID, Proof of Address, Proof of Funds, and AML docs are captured during reservation (Step 3 - Source of Funds)
const REQUIRED_DOCUMENTS = [
    {
        type: 'mortgage_offer',
        label: 'Mortgage Offer',
        description: 'Formal mortgage offer from your lender (if applicable)',
        category: 'buyer',
        icon: '🏦',
        required: false,
        examples: ['Mortgage Agreement in Principle', 'Formal Mortgage Offer', 'Mortgage Illustration']
    },
    {
        type: 'survey_report',
        label: 'Survey Report',
        description: 'Property survey or valuation report (if obtained)',
        category: 'buyer',
        icon: '🏗️',
        required: false,
        examples: ['HomeBuyer Report', 'Building Survey', 'Mortgage Valuation']
    },
    {
        type: 'solicitor_details',
        label: 'Solicitor Details',
        description: 'Contact details and reference for your solicitor',
        category: 'buyer',
        icon: '⚖️',
        required: true,
        examples: ['Solicitor Contact Form', 'Letter of Engagement', 'Solicitor Reference']
    },
    {
        type: 'additional_docs',
        label: 'Additional Documentation',
        description: 'Any other documents required by your solicitor or lender',
        category: 'buyer',
        icon: '📋',
        required: false,
        examples: ['Gift Letter', 'Pension Statement', 'Employment Contract', 'Tax Returns']
    }
];

let uploadedDocuments = [];
let currentUser = null;
let currentReservation = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    loadDocuments();
    renderRequiredDocuments();
    renderUploadedDocuments();
    updateProgress();
});

// Load user data from session
function loadUserData() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    currentUser = user;
    
    if (user.name) {
        document.getElementById('userName').textContent = user.name;
    }

    // Load reservation data (in production, this would come from backend)
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    const userReservations = reservations.filter(r => r.primaryBuyer?.email === user.email);
    
    if (userReservations.length > 0) {
        currentReservation = userReservations[0]; // Most recent reservation
    }
}

// Load existing documents
function loadDocuments() {
    const allDocuments = JSON.parse(localStorage.getItem('plot_documents') || '[]');
    
    // Filter to show only buyer documents for current user
    if (currentUser && currentUser.email) {
        uploadedDocuments = allDocuments.filter(doc => 
            doc.category === 'buyer' && 
            doc.uploadedBy === currentUser.email
        );
    }
}

// Render required documents checklist
function renderRequiredDocuments() {
    const container = document.getElementById('requiredDocuments');
    
    const html = REQUIRED_DOCUMENTS.map(doc => {
        const uploaded = uploadedDocuments.find(ud => ud.type === doc.type);
        const status = uploaded ? 'complete' : 'pending';
        
        return `
            <div class="document-checklist-item" style="display: flex; align-items: start; padding: 1.5rem; border: 2px solid ${status === 'complete' ? '#10B981' : '#E5E7EB'}; border-radius: 8px; margin-bottom: 1rem; background: ${status === 'complete' ? '#F0FDF4' : 'white'};">
                <div style="font-size: 2.5rem; margin-right: 1.5rem;">${doc.icon}</div>
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                        <h3 style="font-size: 1rem; font-weight: 600; margin: 0;">${doc.label}</h3>
                        ${doc.required ? '<span style="background: #FEE2E2; color: #991B1B; padding: 0.125rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">Required</span>' : '<span style="background: #E0E7FF; color: #3730A3; padding: 0.125rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">Optional</span>'}
                        ${status === 'complete' ? '<span style="background: #D1FAE5; color: #065F46; padding: 0.125rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">✓ Uploaded</span>' : ''}
                    </div>
                    <p style="color: #6B7280; font-size: 0.875rem; margin: 0 0 0.75rem 0;">${doc.description}</p>
                    <details style="font-size: 0.875rem; color: #6B7280;">
                        <summary style="cursor: pointer; font-weight: 500; color: #4B5563;">Accepted documents</summary>
                        <ul style="margin: 0.5rem 0 0 1.5rem; padding: 0;">
                            ${doc.examples.map(ex => `<li>${ex}</li>`).join('')}
                        </ul>
                    </details>
                    ${uploaded ? `
                        <div style="margin-top: 1rem; padding: 0.75rem; background: white; border: 1px solid #D1D5DB; border-radius: 6px;">
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <span style="font-size: 1.25rem;">📎</span>
                                    <div>
                                        <div style="font-size: 0.875rem; font-weight: 500;">${uploaded.fileName}</div>
                                        <div style="font-size: 0.75rem; color: #6B7280;">Uploaded ${new Date(uploaded.uploadedDate).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <button onclick="deleteDocument('${uploaded.id}')" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">Replace</button>
                            </div>
                        </div>
                    ` : `
                        <button onclick="openUploadModal('${doc.type}', '${doc.label}')" class="btn btn-primary" style="margin-top: 1rem;">
                            Upload ${doc.label}
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Render uploaded documents
function renderUploadedDocuments() {
    const container = document.getElementById('uploadedDocuments');
    const countEl = document.getElementById('uploadedCount');
    
    if (uploadedDocuments.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #9CA3AF;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
                <p>No documents uploaded yet</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">Upload required documents above to get started</p>
            </div>
        `;
        countEl.textContent = '0 documents';
        return;
    }
    
    countEl.textContent = `${uploadedDocuments.length} document${uploadedDocuments.length !== 1 ? 's' : ''}`;
    
    const html = uploadedDocuments.map(doc => {
        const docInfo = REQUIRED_DOCUMENTS.find(rd => rd.type === doc.type);
        
        return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 1rem; border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 0.75rem;">
                <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                    <div style="font-size: 2rem;">${docInfo ? docInfo.icon : '📄'}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 0.25rem;">${doc.title || docInfo?.label || 'Document'}</div>
                        <div style="font-size: 0.875rem; color: #6B7280;">${doc.fileName}</div>
                        <div style="font-size: 0.75rem; color: #9CA3AF; margin-top: 0.25rem;">
                            Uploaded ${new Date(doc.uploadedDate).toLocaleDateString()} • ${doc.size}
                        </div>
                        ${doc.description ? `<div style="font-size: 0.875rem; color: #6B7280; margin-top: 0.5rem;">${doc.description}</div>` : ''}
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="viewDocument('${doc.id}')" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.875rem;">View</button>
                    <button onclick="deleteDocument('${doc.id}')" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.875rem; color: #DC2626;">Delete</button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// Update progress bar
function updateProgress() {
    const requiredDocs = REQUIRED_DOCUMENTS.filter(d => d.required);
    const completedDocs = requiredDocs.filter(rd => 
        uploadedDocuments.some(ud => ud.type === rd.type)
    );
    
    const percentage = requiredDocs.length > 0 ? Math.round((completedDocs.length / requiredDocs.length) * 100) : 0;
    
    document.getElementById('progressPercentage').textContent = `${percentage}%`;
    document.getElementById('progressText').textContent = `${completedDocs.length} of ${requiredDocs.length} completed`;
    document.getElementById('progressBar').style.width = `${percentage}%`;
}

// Open upload modal
function openUploadModal(docType, docLabel) {
    const modal = document.getElementById('uploadModal');
    document.getElementById('modalTitle').textContent = `Upload ${docLabel}`;
    document.getElementById('uploadDocType').value = docType;
    document.getElementById('uploadDocTypeLabel').value = docLabel;
    modal.style.display = 'flex';
}

// Close upload modal
function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    modal.style.display = 'none';
    document.getElementById('uploadForm').reset();
}

// Handle form submission
document.getElementById('uploadForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const docType = document.getElementById('uploadDocType').value;
    const docLabel = document.getElementById('uploadDocTypeLabel').value;
    const fileInput = document.getElementById('uploadFile');
    const notes = document.getElementById('uploadNotes').value;
    
    if (!fileInput.files || !fileInput.files[0]) {
        alert('Please select a file');
        return;
    }
    
    const file = fileInput.files[0];
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
    }
    
    // Create document object
    const document = {
        id: 'doc_' + Date.now(),
        development: currentReservation?.development || 'Demo Development',
        developmentId: currentReservation?.developmentId || 'dev_1',
        phase: currentReservation?.phase || null,
        plot: currentReservation?.plot || 'Plot 12',
        plotId: currentReservation?.plotId || 'plot_12',
        category: 'buyer',
        type: docType,
        title: docLabel,
        fileName: file.name,
        size: formatFileSize(file.size),
        uploadedDate: new Date().toISOString(),
        uploadedBy: currentUser.email || 'buyer@demo.com',
        description: notes || null
    };
    
    // In production, this would upload to backend
    // For now, simulate file upload and save to localStorage
    
    // Load all documents
    const allDocuments = JSON.parse(localStorage.getItem('plot_documents') || '[]');
    
    // Remove existing document of same type (if replacing)
    const filteredDocs = allDocuments.filter(d => 
        !(d.category === 'buyer' && d.type === docType && d.uploadedBy === currentUser.email)
    );
    
    // Add new document
    filteredDocs.push(document);
    
    // Save back to localStorage
    localStorage.setItem('plot_documents', JSON.stringify(filteredDocs));
    
    // Reload and re-render
    loadDocuments();
    renderRequiredDocuments();
    renderUploadedDocuments();
    updateProgress();
    
    // Close modal
    closeUploadModal();
    
    // Show success message
    showNotification('Document uploaded successfully!', 'success');
});

// Delete document
function deleteDocument(docId) {
    if (!confirm('Are you sure you want to delete this document?')) {
        return;
    }
    
    // Load all documents
    const allDocuments = JSON.parse(localStorage.getItem('plot_documents') || '[]');
    
    // Remove the document
    const filteredDocs = allDocuments.filter(d => d.id !== docId);
    
    // Save back
    localStorage.setItem('plot_documents', JSON.stringify(filteredDocs));
    
    // Reload and re-render
    loadDocuments();
    renderRequiredDocuments();
    renderUploadedDocuments();
    updateProgress();
    
    showNotification('Document deleted successfully', 'success');
}

// View document (simulated)
function viewDocument(docId) {
    const doc = uploadedDocuments.find(d => d.id === docId);
    if (doc) {
        // In production, this would open the actual file
        alert(`Viewing: ${doc.fileName}\n\nIn production, this would open the document in a new window or download it.`);
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('uploadModal');
    if (event.target === modal) {
        closeUploadModal();
    }
}
