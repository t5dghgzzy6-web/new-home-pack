// GDPR-Compliant Document Management System
// Organized by Development → Phase → Plot with role-based access controls

let documents = [];
let currentView = 'developments'; // developments, phases, plots, documents
let selectedDevelopment = null;
let selectedPhase = null;
let selectedPlot = null;

// Document categories with GDPR access rules
const DOCUMENT_CATEGORIES = {
    seller: {
        label: 'Seller Documents',
        description: 'Developer visible only',
        accessRoles: ['developer', 'admin'],
        types: [
            { value: 'title_deeds', label: 'Title Deeds' },
            { value: 'planning_permission', label: 'Planning Permission' },
            { value: 'building_regs', label: 'Building Regulations' },
            { value: 'warranties', label: 'Warranties (NHBC/Premier)' },
            { value: 'specifications', label: 'Build Specifications' },
            { value: 'certificates', label: 'Certificates (EPC, etc.)' },
            { value: 'utilities', label: 'Utilities Information' },
            { value: 'management_info', label: 'Management Company Info' }
        ]
    },
    buyer: {
        label: 'Buyer Documents',
        description: 'Buyer & Developer visible',
        accessRoles: ['buyer', 'developer', 'admin'],
        types: [
            { value: 'id_document', label: 'Photo ID' },
            { value: 'proof_address', label: 'Proof of Address' },
            { value: 'proof_funds', label: 'Proof of Funds' },
            { value: 'mortgage_offer', label: 'Mortgage Offer' },
            { value: 'aml_docs', label: 'AML Documentation' },
            { value: 'bank_statements', label: 'Bank Statements' }
        ]
    },
    shared: {
        label: 'Shared Documents',
        description: 'All parties visible',
        accessRoles: ['buyer', 'developer', 'solicitor', 'admin'],
        types: [
            { value: 'property_pack', label: 'Property Pack' },
            { value: 'floor_plans', label: 'Floor Plans' },
            { value: 'site_plan', label: 'Site Plan' },
            { value: 'brochure', label: 'Marketing Brochure' },
            { value: 'reservation_agreement', label: 'Reservation Agreement' },
            { value: 'sales_contract', label: 'Sales Contract' }
        ]
    },
    legal: {
        label: 'Legal Documents',
        description: 'Solicitors & Developer',
        accessRoles: ['developer', 'solicitor', 'admin'],
        types: [
            { value: 'searches', label: 'Property Searches' },
            { value: 'lease', label: 'Lease Agreement' },
            { value: 'transfer_deed', label: 'Transfer Deed' },
            { value: 'enquiries', label: 'Legal Enquiries' },
            { value: 'completion_statement', label: 'Completion Statement' }
        ]
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadDocuments();
    loadDevelopmentFilters();
    updateUserName();
    renderCurrentView();
});

function updateUserName() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.name) {
        document.getElementById('userName').textContent = currentUser.name;
    }
}

function loadDocuments() {
    const stored = localStorage.getItem('plot_documents');
    if (stored) {
        documents = JSON.parse(stored);
    } else {
        // Create demo data with proper hierarchy
        documents = [
            {
                id: 'doc1',
                development: 'Riverside Gardens',
                developmentId: 'dev1',
                phase: null,
                plot: 'Plot 12',
                plotId: 'plot12',
                category: 'seller',
                type: 'title_deeds',
                title: 'Title Deeds - Plot 12',
                fileName: 'title-deeds-plot12.pdf',
                size: '1.2 MB',
                uploadedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                uploadedBy: 'developer@demo.com',
                description: 'Official title deeds for Plot 12'
            },
            {
                id: 'doc2',
                development: 'Riverside Gardens',
                developmentId: 'dev1',
                phase: null,
                plot: 'Plot 12',
                plotId: 'plot12',
                category: 'shared',
                type: 'property_pack',
                title: 'Property Pack - Plot 12',
                fileName: 'property-pack-plot12.pdf',
                size: '4.8 MB',
                uploadedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
                uploadedBy: 'developer@demo.com',
                description: 'Complete property information pack'
            },
            {
                id: 'doc3',
                development: 'Parkside View',
                developmentId: 'dev2',
                phase: 'Phase 1',
                plot: 'Plot 8',
                plotId: 'plot8',
                category: 'shared',
                type: 'floor_plans',
                title: 'Floor Plans - Plot 8',
                fileName: 'floor-plans-plot8.pdf',
                size: '856 KB',
                uploadedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                uploadedBy: 'developer@demo.com',
                description: 'Detailed floor plans'
            },
            {
                id: 'doc4',
                development: 'Riverside Gardens',
                developmentId: 'dev1',
                phase: null,
                plot: 'Plot 12',
                plotId: 'plot12',
                category: 'buyer',
                type: 'proof_funds',
                title: 'Proof of Funds',
                fileName: 'pof-john-smith.pdf',
                size: '432 KB',
                uploadedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                uploadedBy: 'buyer@demo.com',
                description: 'Bank statements showing available funds'
            }
        ];
        localStorage.setItem('plot_documents', JSON.stringify(documents));
    }
}

function loadDevelopmentFilters() {
    const developments = JSON.parse(localStorage.getItem('developments') || '[]');
    const select = document.getElementById('developmentFilter');
    const uploadSelect = document.getElementById('docDevelopment');
    
    developments.forEach(dev => {
        const option = document.createElement('option');
        option.value = dev.id;
        option.textContent = dev.name;
        select.appendChild(option.cloneNode(true));
        uploadSelect.appendChild(option);
    });
}

function navigateToDevelopments() {
    currentView = 'developments';
    selectedDevelopment = null;
    selectedPhase = null;
    selectedPlot = null;
    renderCurrentView();
}

function onDevelopmentChange() {
    const devId = document.getElementById('developmentFilter').value;
    if (!devId) {
        navigateToDevelopments();
        return;
    }
    
    const developments = JSON.parse(localStorage.getItem('developments') || '[]');
    const dev = developments.find(d => d.id === devId);
    
    if (dev) {
        selectedDevelopment = dev;
        currentView = 'phases';
        renderCurrentView();
    }
}

function onPhaseChange() {
    const phase = document.getElementById('phaseFilter').value;
    selectedPhase = phase || null;
    currentView = 'plots';
    renderCurrentView();
}

function onPlotChange() {
    const plotId = document.getElementById('plotFilter').value;
    if (plotId) {
        selectedPlot = plotId;
        currentView = 'documents';
    } else {
        currentView = 'plots';
    }
    renderCurrentView();
}

function renderCurrentView() {
    updateBreadcrumbs();
    
    switch(currentView) {
        case 'developments':
            renderDevelopmentsView();
            break;
        case 'phases':
            renderPhasesView();
            break;
        case 'plots':
            renderPlotsView();
            break;
        case 'documents':
            renderDocumentsView();
            break;
    }
}

function updateBreadcrumbs() {
    const breadcrumbs = document.getElementById('breadcrumbs');
    let html = '<a href="#" onclick="navigateToDevelopments(); return false;" style="color: #D32F2F; text-decoration: none; font-weight: 500;">All Developments</a>';
    
    if (selectedDevelopment) {
        html += ' <span style="color: #9CA3AF;">→</span> ';
        html += `<a href="#" onclick="navigateToDevelopment('${selectedDevelopment.id}'); return false;" style="color: #D32F2F; text-decoration: none; font-weight: 500;">${selectedDevelopment.name}</a>`;
    }
    
    if (selectedPhase) {
        html += ' <span style="color: #9CA3AF;">→</span> ';
        html += `<span style="color: #1F2937; font-weight: 500;">${selectedPhase}</span>`;
    }
    
    if (selectedPlot) {
        html += ' <span style="color: #9CA3AF;">→</span> ';
        html += `<span style="color: #1F2937; font-weight: 500;">${selectedPlot}</span>`;
    }
    
    breadcrumbs.innerHTML = html;
}

function navigateToDevelopment(devId) {
    const developments = JSON.parse(localStorage.getItem('developments') || '[]');
    const dev = developments.find(d => d.id === devId);
    if (dev) {
        selectedDevelopment = dev;
        selectedPhase = null;
        selectedPlot = null;
        currentView = 'phases';
        renderCurrentView();
    }
}

function renderDevelopmentsView() {
    const developments = JSON.parse(localStorage.getItem('developments') || '[]');
    const view = document.getElementById('hierarchyView');
    
    if (developments.length === 0) {
        view.innerHTML = '<div style="text-align: center; padding: 4rem; color: #6B7280;">No developments found. Create a development first.</div>';
        return;
    }
    
    view.innerHTML = `
        <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
            ${developments.map(dev => {
                const devDocs = documents.filter(d => d.developmentId === dev.id);
                return `
                    <div class="card" style="cursor: pointer; transition: transform 0.2s;" onclick="navigateToDevelopment('${dev.id}')">
                        <div style="padding: 1.5rem;">
                            <div style="font-size: 2rem; margin-bottom: 1rem;">🏗️</div>
                            <h3 style="font-size: 1.125rem; font-weight: 600; color: #1F2937; margin-bottom: 0.5rem;">${dev.name}</h3>
                            <p style="font-size: 0.875rem; color: #6B7280; margin-bottom: 1rem;">📍 ${dev.location || 'Location not set'}</p>
                            <div style="display: flex; justify-content: space-between; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                                <span style="font-size: 0.875rem; color: #6B7280;">${devDocs.length} documents</span>
                                <span style="font-size: 0.875rem; color: #D32F2F; font-weight: 500;">View →</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderPhasesView() {
    if (!selectedDevelopment) return;
    
    // Get unique phases for this development
    const devDocs = documents.filter(d => d.developmentId === selectedDevelopment.id);
    const phases = [...new Set(devDocs.map(d => d.phase).filter(p => p))];
    const noPhaseDocs = devDocs.filter(d => !d.phase);
    
    const view = document.getElementById('hierarchyView');
    
    if (phases.length === 0 && noPhaseDocs.length === 0) {
        view.innerHTML = `
            <div style="text-align: center; padding: 4rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
                <h3 style="font-size: 1.25rem; font-weight: 600; color: #1F2937; margin-bottom: 0.5rem;">No documents yet</h3>
                <p style="color: #6B7280;">Upload documents for this development to get started.</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">';
    
    // Show "No Phase" option if there are unphased documents
    if (noPhaseDocs.length > 0) {
        html += `
            <div class="card" style="cursor: pointer;" onclick="selectPhase(null)">
                <div style="padding: 1.5rem;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">📁</div>
                    <h3 style="font-size: 1.125rem; font-weight: 600; color: #1F2937; margin-bottom: 0.5rem;">No Phase</h3>
                    <p style="font-size: 0.875rem; color: #6B7280; margin-bottom: 1rem;">Single phase development</p>
                    <div style="display: flex; justify-content: space-between; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                        <span style="font-size: 0.875rem; color: #6B7280;">${noPhaseDocs.length} documents</span>
                        <span style="font-size: 0.875rem; color: #D32F2F; font-weight: 500;">View →</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Show phase cards
    phases.forEach(phase => {
        const phaseDocs = devDocs.filter(d => d.phase === phase);
        html += `
            <div class="card" style="cursor: pointer;" onclick="selectPhase('${phase}')">
                <div style="padding: 1.5rem;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">📁</div>
                    <h3 style="font-size: 1.125rem; font-weight: 600; color: #1F2937; margin-bottom: 0.5rem;">${phase}</h3>
                    <p style="font-size: 0.875rem; color: #6B7280; margin-bottom: 1rem;">Development phase</p>
                    <div style="display: flex; justify-content: space-between; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                        <span style="font-size: 0.875rem; color: #6B7280;">${phaseDocs.length} documents</span>
                        <span style="font-size: 0.875rem; color: #D32F2F; font-weight: 500;">View →</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    view.innerHTML = html;
}

function selectPhase(phase) {
    selectedPhase = phase;
    currentView = 'plots';
    renderCurrentView();
}

function renderPlotsView() {
    if (!selectedDevelopment) return;
    
    // Get unique plots for this development/phase
    let plotDocs = documents.filter(d => d.developmentId === selectedDevelopment.id);
    if (selectedPhase !== null) {
        plotDocs = plotDocs.filter(d => d.phase === selectedPhase);
    } else {
        plotDocs = plotDocs.filter(d => !d.phase);
    }
    
    const plots = [...new Set(plotDocs.map(d => d.plot))];
    const view = document.getElementById('hierarchyView');
    
    if (plots.length === 0) {
        view.innerHTML = `
            <div style="text-align: center; padding: 4rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🏡</div>
                <h3 style="font-size: 1.25rem; font-weight: 600; color: #1F2937; margin-bottom: 0.5rem;">No plots with documents</h3>
                <p style="color: #6B7280;">Upload documents for specific plots to get started.</p>
            </div>
        `;
        return;
    }
    
    view.innerHTML = `
        <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
            ${plots.sort().map(plot => {
                const docs = plotDocs.filter(d => d.plot === plot);
                const plotId = docs[0]?.plotId;
                return `
                    <div class="card" style="cursor: pointer;" onclick="selectPlot('${plotId}', '${plot}')">
                        <div style="padding: 1.5rem;">
                            <div style="font-size: 2rem; margin-bottom: 1rem;">🏡</div>
                            <h3 style="font-size: 1.125rem; font-weight: 600; color: #1F2937; margin-bottom: 0.5rem;">${plot}</h3>
                            <div style="margin-bottom: 1rem;">
                                ${getCategoryBreakdown(docs)}
                            </div>
                            <div style="display: flex; justify-content: space-between; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                                <span style="font-size: 0.875rem; color: #6B7280;">${docs.length} documents</span>
                                <span style="font-size: 0.875rem; color: #D32F2F; font-weight: 500;">View →</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function getCategoryBreakdown(docs) {
    const counts = {
        seller: docs.filter(d => d.category === 'seller').length,
        buyer: docs.filter(d => d.category === 'buyer').length,
        shared: docs.filter(d => d.category === 'shared').length,
        legal: docs.filter(d => d.category === 'legal').length
    };
    
    let html = '<div style="display: flex; gap: 0.5rem; flex-wrap: wrap; font-size: 0.75rem;">';
    if (counts.seller > 0) html += `<span class="badge" style="background-color: #fef3c7; color: #92400e;">Seller: ${counts.seller}</span>`;
    if (counts.buyer > 0) html += `<span class="badge" style="background-color: #dbeafe; color: #1e40af;">Buyer: ${counts.buyer}</span>`;
    if (counts.shared > 0) html += `<span class="badge" style="background-color: #d1fae5; color: #065f46;">Shared: ${counts.shared}</span>`;
    if (counts.legal > 0) html += `<span class="badge" style="background-color: #e0e7ff; color: #4338ca;">Legal: ${counts.legal}</span>`;
    html += '</div>';
    
    return html;
}

function selectPlot(plotId, plotName) {
    selectedPlot = plotName;
    currentView = 'documents';
    renderCurrentView();
}

function renderDocumentsView() {
    if (!selectedDevelopment || !selectedPlot) return;
    
    // Get current user role for GDPR filtering
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userRole = currentUser.userType || 'buyer';
    
    // Filter documents by plot
    let plotDocs = documents.filter(d => 
        d.developmentId === selectedDevelopment.id &&
        d.plot === selectedPlot &&
        (selectedPhase === null ? !d.phase : d.phase === selectedPhase)
    );
    
    // Apply GDPR access control
    plotDocs = plotDocs.filter(doc => {
        const category = DOCUMENT_CATEGORIES[doc.category];
        return category && category.accessRoles.includes(userRole);
    });
    
    const view = document.getElementById('hierarchyView');
    
    if (plotDocs.length === 0) {
        view.innerHTML = `
            <div style="text-align: center; padding: 4rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
                <h3 style="font-size: 1.25rem; font-weight: 600; color: #1F2937; margin-bottom: 0.5rem;">No accessible documents</h3>
                <p style="color: #6B7280;">No documents available for your role or none uploaded yet.</p>
            </div>
        `;
        return;
    }
    
    // Group by category
    const grouped = {};
    plotDocs.forEach(doc => {
        if (!grouped[doc.category]) grouped[doc.category] = [];
        grouped[doc.category].push(doc);
    });
    
    let html = '';
    
    Object.keys(grouped).sort().forEach(category => {
        const categoryInfo = DOCUMENT_CATEGORIES[category];
        const docs = grouped[category];
        
        html += `
            <div style="margin-bottom: 2rem;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <h3 style="font-size: 1.125rem; font-weight: 600; color: #1F2937;">${categoryInfo.label}</h3>
                    <span class="badge" style="background-color: #f3f4f6; color: #6B7280;">
                        🔒 ${categoryInfo.description}
                    </span>
                </div>
                <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
                    ${docs.map(doc => renderDocumentCard(doc)).join('')}
                </div>
            </div>
        `;
    });
    
    view.innerHTML = html;
}

function renderDocumentCard(doc) {
    const typeInfo = Object.values(DOCUMENT_CATEGORIES)
        .flatMap(cat => cat.types)
        .find(t => t.value === doc.type);
    
    return `
        <div class="card" style="padding: 1.25rem;">
            <div style="display: flex; align-items: start; justify-content: space-between; margin-bottom: 0.75rem;">
                <div style="font-size: 2rem;">${getDocumentIcon(doc.type)}</div>
                ${getCategoryBadge(doc.category)}
            </div>
            
            <h4 style="font-size: 0.875rem; font-weight: 600; color: #1F2937; margin-bottom: 0.5rem;">
                ${typeInfo ? typeInfo.label : doc.type}
            </h4>
            
            <p style="font-size: 0.875rem; color: #1F2937; margin-bottom: 0.5rem;">
                ${doc.title}
            </p>
            
            <div style="font-size: 0.75rem; color: #9CA3AF; margin-bottom: 0.75rem;">
                ${doc.fileName}<br>
                ${doc.size} • ${formatDate(doc.uploadedDate)}
            </div>
            
            ${doc.description ? `
                <p style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.75rem; line-height: 1.4;">
                    ${doc.description}
                </p>
            ` : ''}
            
            <div style="display: flex; gap: 0.5rem; padding-top: 0.75rem; border-top: 1px solid #e5e7eb;">
                <button class="btn btn-primary btn-sm" style="flex: 1; font-size: 0.75rem;" onclick="downloadDocument('${doc.id}')">
                    📥 Download
                </button>
                <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem;" onclick="shareDocument('${doc.id}')">
                    🔗
                </button>
                ${canDeleteDocument(doc) ? `
                    <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem;" onclick="deleteDocument('${doc.id}')">
                        🗑️
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function canDeleteDocument(doc) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userRole = currentUser.userType || 'buyer';
    const userEmail = currentUser.email || '';
    
    // Admin can delete anything
    if (userRole === 'admin') return true;
    
    // Developer can delete seller/shared/legal docs
    if (userRole === 'developer' && ['seller', 'shared', 'legal'].includes(doc.category)) return true;
    
    // Users can delete their own buyer documents
    if (doc.category === 'buyer' && doc.uploadedBy === userEmail) return true;
    
    return false;
}

function getDocumentIcon(type) {
    const icons = {
        title_deeds: '📜',
        planning_permission: '📋',
        building_regs: '🏗️',
        warranties: '🛡️',
        specifications: '📐',
        certificates: '📄',
        utilities: '⚡',
        management_info: '🏢',
        id_document: '🪪',
        proof_address: '📬',
        proof_funds: '💰',
        mortgage_offer: '🏦',
        aml_docs: '✅',
        bank_statements: '🏧',
        property_pack: '📦',
        floor_plans: '📐',
        site_plan: '🗺️',
        brochure: '📸',
        reservation_agreement: '📝',
        sales_contract: '📄',
        searches: '🔍',
        lease: '📄',
        transfer_deed: '📜',
        enquiries: '❓',
        completion_statement: '💵'
    };
    return icons[type] || '📄';
}

function getCategoryBadge(category) {
    const badges = {
        seller: '<span class="badge" style="background-color: #fef3c7; color: #92400e; font-size: 0.625rem;">Seller</span>',
        buyer: '<span class="badge" style="background-color: #dbeafe; color: #1e40af; font-size: 0.625rem;">Buyer</span>',
        shared: '<span class="badge" style="background-color: #d1fae5; color: #065f46; font-size: 0.625rem;">Shared</span>',
        legal: '<span class="badge" style="background-color: #e0e7ff; color: #4338ca; font-size: 0.625rem;">Legal</span>'
    };
    return badges[category] || '';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function searchDocuments() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (!searchTerm) {
        renderCurrentView();
        return;
    }
    
    // Search across all documents the user has access to
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const userRole = currentUser.userType || 'buyer';
    
    const results = documents.filter(doc => {
        // GDPR check
        const category = DOCUMENT_CATEGORIES[doc.category];
        if (!category || !category.accessRoles.includes(userRole)) return false;
        
        // Search check
        return doc.title.toLowerCase().includes(searchTerm) ||
               doc.fileName.toLowerCase().includes(searchTerm) ||
               doc.plot.toLowerCase().includes(searchTerm) ||
               doc.development.toLowerCase().includes(searchTerm) ||
               (doc.description && doc.description.toLowerCase().includes(searchTerm));
    });
    
    const view = document.getElementById('hierarchyView');
    
    if (results.length === 0) {
        view.innerHTML = `
            <div style="text-align: center; padding: 4rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                <h3 style="font-size: 1.25rem; font-weight: 600; color: #1F2937; margin-bottom: 0.5rem;">No results found</h3>
                <p style="color: #6B7280;">Try a different search term</p>
            </div>
        `;
        return;
    }
    
    view.innerHTML = `
        <div>
            <h3 style="font-size: 1.125rem; font-weight: 600; color: #1F2937; margin-bottom: 1.5rem;">
                Search Results (${results.length})
            </h3>
            <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
                ${results.map(doc => renderDocumentCard(doc)).join('')}
            </div>
        </div>
    `;
}

// Upload Modal Functions
function showUploadModal() {
    document.getElementById('uploadModal').classList.add('active');
    loadDevelopmentsDropdown();
}

function closeUploadModal() {
    document.getElementById('uploadModal').classList.remove('active');
    document.getElementById('uploadForm').reset();
}

function loadDevelopmentsDropdown() {
    const developments = JSON.parse(localStorage.getItem('developments') || '[]');
    const select = document.getElementById('docDevelopment');
    select.innerHTML = '<option value="">Select development...</option>';
    
    developments.forEach(dev => {
        const option = document.createElement('option');
        option.value = dev.id;
        option.textContent = dev.name;
        option.dataset.name = dev.name;
        select.appendChild(option);
    });
}

function onUploadDevelopmentChange() {
    const select = document.getElementById('docDevelopment');
    const devId = select.value;
    const plotSelect = document.getElementById('docPlot');
    
    plotSelect.innerHTML = '<option value="">Select plot...</option>';
    
    if (!devId) return;
    
    // In production, fetch plots from API
    // For now, allow manual entry or show plots from localStorage
    const plots = JSON.parse(localStorage.getItem('plots') || '[]')
        .filter(p => p.developmentId === devId);
    
    if (plots.length > 0) {
        plots.forEach(plot => {
            const option = document.createElement('option');
            option.value = plot.id;
            option.textContent = plot.name || `Plot ${plot.number}`;
            option.dataset.name = plot.name || `Plot ${plot.number}`;
            plotSelect.appendChild(option);
        });
    } else {
        // Allow custom plot entry
        for (let i = 1; i <= 50; i++) {
            const option = document.createElement('option');
            option.value = `plot${i}`;
            option.textContent = `Plot ${i}`;
            option.dataset.name = `Plot ${i}`;
            plotSelect.appendChild(option);
        }
    }
}

function updateDocumentTypeOptions() {
    const category = document.getElementById('docCategory').value;
    const typeSelect = document.getElementById('docType');
    
    typeSelect.innerHTML = '<option value="">Select type...</option>';
    
    if (!category || !DOCUMENT_CATEGORIES[category]) return;
    
    DOCUMENT_CATEGORIES[category].types.forEach(type => {
        const option = document.createElement('option');
        option.value = type.value;
        option.textContent = type.label;
        typeSelect.appendChild(option);
    });
}

function handleUpload(event) {
    event.preventDefault();
    
    const devSelect = document.getElementById('docDevelopment');
    const plotSelect = document.getElementById('docPlot');
    const fileInput = document.getElementById('docFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file to upload');
        return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit');
        return;
    }
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    const newDocument = {
        id: 'doc' + Date.now(),
        development: devSelect.options[devSelect.selectedIndex].dataset.name,
        developmentId: devSelect.value,
        phase: document.getElementById('docPhase').value || null,
        plot: plotSelect.options[plotSelect.selectedIndex].dataset.name,
        plotId: plotSelect.value,
        category: document.getElementById('docCategory').value,
        type: document.getElementById('docType').value,
        title: document.getElementById('docTitle').value,
        fileName: file.name,
        size: formatFileSize(file.size),
        uploadedDate: new Date().toISOString(),
        uploadedBy: currentUser.email || 'unknown',
        description: document.getElementById('docDescription').value || null
    };
    
    documents.push(newDocument);
    localStorage.setItem('plot_documents', JSON.stringify(documents));
    
    closeUploadModal();
    loadDocuments();
    renderCurrentView();
    
    alert('✅ Document uploaded successfully!');
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function downloadDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (doc) {
        alert(`Downloading: ${doc.fileName}\n\nIn production, this would download the actual file from secure storage.`);
    }
}

function shareDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (doc) {
        const shareUrl = `https://newhomepack.com/documents/${doc.id}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareUrl);
            alert('🔗 Share link copied to clipboard!\n\n' + shareUrl);
        } else {
            alert('🔗 Share link:\n\n' + shareUrl);
        }
    }
}

function deleteDocument(id) {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;
    
    if (!canDeleteDocument(doc)) {
        alert('⛔ You do not have permission to delete this document.');
        return;
    }
    
    if (confirm(`Are you sure you want to delete "${doc.title}"?\n\nThis action cannot be undone.`)) {
        documents = documents.filter(d => d.id !== id);
        localStorage.setItem('plot_documents', JSON.stringify(documents));
        loadDocuments();
        renderCurrentView();
        alert('✅ Document deleted successfully');
    }
}
