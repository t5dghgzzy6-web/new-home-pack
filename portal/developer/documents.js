// Documents Management
let documents = [];
let filteredDocuments = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    loadDocuments();
    loadDevelopmentsDropdown();
    updateUserName();
});

function updateUserName() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.name) {
        document.getElementById('userName').textContent = currentUser.name;
    }
}

function loadDocuments() {
    // Load from localStorage
    const stored = localStorage.getItem('documents');
    if (stored) {
        documents = JSON.parse(stored);
    } else {
        // Add demo documents
        documents = [
            {
                id: 'doc1',
                type: 'property_pack',
                title: 'Plot 12 Property Pack',
                development: 'Riverside Gardens',
                fileName: 'plot-12-property-pack.pdf',
                size: '2.4 MB',
                uploadedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                description: 'Complete property pack including title deeds, searches, and floor plans'
            },
            {
                id: 'doc2',
                type: 'agreement',
                title: 'Signed Reservation Agreement - Plot 8',
                development: 'Parkside View',
                fileName: 'reservation-agreement-plot8.pdf',
                size: '1.2 MB',
                uploadedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                description: 'Fully signed reservation agreement from all parties'
            },
            {
                id: 'doc3',
                type: 'legal',
                title: 'Development Legal Pack',
                development: 'Riverside Gardens',
                fileName: 'legal-pack-riverside.zip',
                size: '8.7 MB',
                uploadedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                description: 'Planning permissions, building regulations, and warranties'
            },
            {
                id: 'doc4',
                type: 'template',
                title: 'Reservation Agreement Template',
                development: 'All Developments',
                fileName: 'reservation-template.docx',
                size: '156 KB',
                uploadedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                description: 'Standard reservation agreement template'
            }
        ];
        localStorage.setItem('documents', JSON.stringify(documents));
    }
    
    filteredDocuments = [...documents];
    renderDocuments();
}

function loadDevelopmentsDropdown() {
    const developments = JSON.parse(localStorage.getItem('developments') || '[]');
    const select = document.getElementById('docDevelopment');
    
    developments.forEach(dev => {
        const option = document.createElement('option');
        option.value = dev.name;
        option.textContent = dev.name;
        select.appendChild(option);
    });
}

function renderDocuments() {
    const grid = document.getElementById('documentsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (filteredDocuments.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    
    grid.innerHTML = filteredDocuments.map(doc => `
        <div class="card" style="padding: 1.5rem;">
            <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 1rem;">
                <div style="font-size: 2.5rem;">
                    ${getDocumentIcon(doc.type)}
                </div>
                ${getDocumentTypeBadge(doc.type)}
            </div>
            
            <h3 style="font-size: 1rem; font-weight: 600; color: #1F2937; margin-bottom: 0.5rem; line-height: 1.4;">
                ${doc.title}
            </h3>
            
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem;">
                <div style="font-size: 0.875rem; color: #6B7280;">
                    📍 ${doc.development}
                </div>
                <div style="font-size: 0.875rem; color: #9CA3AF;">
                    ${doc.fileName}
                </div>
                <div style="font-size: 0.875rem; color: #9CA3AF;">
                    ${doc.size} • ${formatDate(doc.uploadedDate)}
                </div>
            </div>
            
            ${doc.description ? `
                <p style="font-size: 0.875rem; color: #6B7280; line-height: 1.5; margin-bottom: 1rem;">
                    ${doc.description}
                </p>
            ` : ''}
            
            <div style="display: flex; gap: 0.5rem; margin-top: auto; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                <button class="btn btn-primary btn-sm" style="flex: 1;" onclick="downloadDocument('${doc.id}')">
                    📥 Download
                </button>
                <button class="btn btn-secondary btn-sm" onclick="shareDocument('${doc.id}')">
                    🔗
                </button>
                <button class="btn btn-secondary btn-sm" onclick="deleteDocument('${doc.id}')">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

function getDocumentIcon(type) {
    const icons = {
        property_pack: '📦',
        agreement: '📝',
        legal: '⚖️',
        template: '📄',
        other: '📋'
    };
    return icons[type] || '📋';
}

function getDocumentTypeBadge(type) {
    const badges = {
        property_pack: '<span class="badge" style="background-color: #dbeafe; color: #1e40af;">Property Pack</span>',
        agreement: '<span class="badge" style="background-color: #d1fae5; color: #065f46;">Agreement</span>',
        legal: '<span class="badge" style="background-color: #fef3c7; color: #92400e;">Legal</span>',
        template: '<span class="badge" style="background-color: #e0e7ff; color: #4338ca;">Template</span>',
        other: '<span class="badge" style="background-color: #e5e7eb; color: #374151;">Other</span>'
    };
    return badges[type] || badges.other;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function filterDocuments(type) {
    currentFilter = type;
    
    // Update button states
    document.querySelectorAll('.btn-secondary').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (type === 'all') {
        filteredDocuments = [...documents];
    } else {
        filteredDocuments = documents.filter(doc => doc.type === type);
    }
    
    renderDocuments();
}

function searchDocuments() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        if (currentFilter === 'all') {
            filteredDocuments = [...documents];
        } else {
            filteredDocuments = documents.filter(doc => doc.type === currentFilter);
        }
    } else {
        let baseDocuments = currentFilter === 'all' ? documents : documents.filter(doc => doc.type === currentFilter);
        
        filteredDocuments = baseDocuments.filter(doc => 
            doc.title.toLowerCase().includes(searchTerm) ||
            doc.fileName.toLowerCase().includes(searchTerm) ||
            doc.development.toLowerCase().includes(searchTerm) ||
            (doc.description && doc.description.toLowerCase().includes(searchTerm))
        );
    }
    
    renderDocuments();
}

function showUploadModal() {
    document.getElementById('uploadModal').classList.add('active');
}

function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
    document.getElementById('uploadForm').reset();
}

function handleUpload(event) {
    event.preventDefault();
    
    const fileInput = document.getElementById('docFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file to upload');
        return;
    }
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit');
        return;
    }
    
    const newDocument = {
        id: 'doc' + Date.now(),
        type: document.getElementById('docType').value,
        title: document.getElementById('docTitle').value,
        development: document.getElementById('docDevelopment').value || 'All Developments',
        fileName: file.name,
        size: formatFileSize(file.size),
        uploadedDate: new Date().toISOString(),
        description: document.getElementById('docDescription').value
    };
    
    documents.unshift(newDocument);
    localStorage.setItem('documents', JSON.stringify(documents));
    
    closeUploadModal();
    
    // Reset filter to show all if needed
    if (currentFilter !== 'all' && currentFilter !== newDocument.type) {
        filterDocuments('all');
        document.querySelectorAll('.btn-secondary')[0].classList.add('active');
    } else {
        loadDocuments();
    }
    
    alert('Document uploaded successfully!');
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function downloadDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (doc) {
        // In production, this would trigger actual file download
        alert(`Downloading: ${doc.fileName}\n\nIn production, this would download the actual file.`);
    }
}

function shareDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (doc) {
        // In production, this would generate a shareable link
        const shareUrl = `https://newhomepack.com/documents/${doc.id}`;
        
        // Copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareUrl);
            alert('Share link copied to clipboard!\n\n' + shareUrl);
        } else {
            alert('Share link:\n\n' + shareUrl);
        }
    }
}

function deleteDocument(id) {
    if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
        documents = documents.filter(d => d.id !== id);
        localStorage.setItem('documents', JSON.stringify(documents));
        loadDocuments();
    }
}
