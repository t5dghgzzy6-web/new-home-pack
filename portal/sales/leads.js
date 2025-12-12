// Sales Leads JavaScript
// Lead management and conversion tracking

// Check authentication
checkAuth('sales');

let allLeads = [];
let filteredLeads = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    loadLeads();
    populateFilters();
    loadLeadsTable();
    
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action === 'new') {
        openNewLeadModal();
    }
});

// Load user information
function loadUserInfo() {
    const user = JSON.parse(localStorage.getItem('nhp_user'));
    if (user && user.name) {
        document.getElementById('userName').textContent = user.name;
    }
}

// Load leads
function loadLeads() {
    const leadsStr = localStorage.getItem('nhp_leads');
    allLeads = leadsStr ? JSON.parse(leadsStr) : [];
    filteredLeads = [...allLeads];
}

// Populate filters
function populateFilters() {
    // Populate development filter
    const developments = [...new Set(allLeads.map(l => l.development).filter(d => d))];
    const devSelect = document.getElementById('filterDevelopment');
    
    developments.forEach(dev => {
        const option = document.createElement('option');
        option.value = dev;
        option.textContent = dev;
        devSelect.appendChild(option);
    });
}

// Load leads table
function loadLeadsTable() {
    const container = document.getElementById('leadsTable');
    
    document.getElementById('leadsCount').textContent = `${filteredLeads.length} leads`;
    
    if (filteredLeads.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <h3 class="empty-state-title">No Leads Yet</h3>
                <p class="empty-state-text">Add your first lead to get started.</p>
                <button class="btn btn-primary" style="margin-top: 1rem;" onclick="openNewLeadModal()">
                    Add Lead
                </button>
            </div>
        `;
        return;
    }
    
    // Sort by creation date (newest first)
    filteredLeads.sort((a, b) => b.createdDate - a.createdDate);
    
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Development</th>
                    <th>Plot</th>
                    <th>Budget</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filteredLeads.forEach(lead => {
        // Status badge
        let statusColor = '';
        let statusText = '';
        
        switch (lead.status) {
            case 'new':
                statusColor = '#3B82F6';
                statusText = 'New';
                break;
            case 'contacted':
                statusColor = '#8B5CF6';
                statusText = 'Contacted';
                break;
            case 'viewing_scheduled':
                statusColor = '#F59E0B';
                statusText = 'Viewing';
                break;
            case 'offer_made':
                statusColor = '#10B981';
                statusText = 'Offer Made';
                break;
            case 'converted':
                statusColor = '#DC2626';
                statusText = 'Converted';
                break;
            case 'lost':
                statusColor = '#6B7280';
                statusText = 'Lost';
                break;
            default:
                statusColor = '#6B7280';
                statusText = lead.status;
        }
        
        // Days in pipeline
        const daysOld = Math.floor((Date.now() - lead.createdDate) / (1000 * 60 * 60 * 24));
        
        html += `
            <tr>
                <td>
                    <div style="font-weight: 600;">${lead.name}</div>
                    ${daysOld > 0 ? `<div style="font-size: 0.75rem; color: #6B7280;">${daysOld} days in pipeline</div>` : ''}
                </td>
                <td>
                    <div style="font-size: 0.875rem;">${lead.email}</div>
                    <div style="font-size: 0.75rem; color: #6B7280;">${lead.phone}</div>
                </td>
                <td>${lead.development || '-'}</td>
                <td>${lead.plotInterest ? `Plot ${lead.plotInterest}` : '-'}</td>
                <td>${lead.budget ? '£' + parseInt(lead.budget).toLocaleString() : '-'}</td>
                <td>
                    <span style="background: ${statusColor}20; color: ${statusColor}; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; white-space: nowrap;">
                        ${statusText}
                    </span>
                </td>
                <td style="text-transform: capitalize;">${lead.source}</td>
                <td>${new Date(lead.createdDate).toLocaleDateString()}</td>
                <td>
                    <button class="btn-icon" onclick="viewLead('${lead.id}')" title="View details">
                        👁️
                    </button>
                    <button class="btn-icon" onclick="editLead('${lead.id}')" title="Edit">
                        ✏️
                    </button>
                    <button class="btn-icon" onclick="updateStatus('${lead.id}')" title="Update status">
                        📝
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

// Filter leads
function filterLeads() {
    const statusFilter = document.getElementById('filterStatus').value;
    const sourceFilter = document.getElementById('filterSource').value;
    const devFilter = document.getElementById('filterDevelopment').value;
    
    filteredLeads = allLeads.filter(lead => {
        if (statusFilter && lead.status !== statusFilter) return false;
        if (sourceFilter && lead.source !== sourceFilter) return false;
        if (devFilter && lead.development !== devFilter) return false;
        return true;
    });
    
    loadLeadsTable();
}

// Clear filters
function clearFilters() {
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterSource').value = '';
    document.getElementById('filterDevelopment').value = '';
    filteredLeads = [...allLeads];
    loadLeadsTable();
}

// New lead modal
function openNewLeadModal() {
    document.getElementById('newLeadModal').style.display = 'flex';
}

function closeNewLeadModal() {
    document.getElementById('newLeadModal').style.display = 'none';
    document.getElementById('newLeadForm').reset();
}

function submitLead(event) {
    event.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('nhp_user'));
    
    const lead = {
        id: 'LEAD-' + Date.now(),
        name: document.getElementById('leadName').value,
        email: document.getElementById('leadEmail').value,
        phone: document.getElementById('leadPhone').value,
        source: document.getElementById('leadSource').value,
        development: document.getElementById('leadDevelopment').value,
        plotInterest: document.getElementById('leadPlot').value,
        budget: document.getElementById('leadBudget').value,
        status: document.getElementById('leadStatus').value,
        notes: document.getElementById('leadNotes').value,
        createdDate: Date.now(),
        lastContact: Date.now(),
        assignedTo: user.email || 'sales@newhomepack.com'
    };
    
    allLeads.push(lead);
    localStorage.setItem('nhp_leads', JSON.stringify(allLeads));
    
    showNotification('Lead added successfully', 'success');
    closeNewLeadModal();
    
    // Refresh data
    loadLeads();
    populateFilters();
    loadLeadsTable();
}

// View lead
function viewLead(leadId) {
    const lead = allLeads.find(l => l.id === leadId);
    if (!lead) {
        showNotification('Lead not found', 'error');
        return;
    }
    
    // Create detailed view modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    const statusColors = {
        'new': '#3B82F6',
        'contacted': '#8B5CF6',
        'viewing_scheduled': '#F59E0B',
        'offer_made': '#10B981',
        'converted': '#DC2626',
        'lost': '#6B7280'
    };
    
    const statusColor = statusColors[lead.status] || '#6B7280';
    const daysOld = Math.floor((Date.now() - lead.createdDate) / (1000 * 60 * 60 * 24));
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
                <div>
                    <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">${lead.name}</h2>
                    <div style="display: flex; gap: 1rem; font-size: 0.875rem; color: #6B7280;">
                        <span>${lead.email}</span>
                        <span>•</span>
                        <span>${lead.phone}</span>
                        <span>•</span>
                        <span>${daysOld} days in pipeline</span>
                    </div>
                </div>
                <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6B7280;">✕</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;">
                <div style="background: #F9FAFB; padding: 1rem; border-radius: 0.5rem;">
                    <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">STATUS</div>
                    <span style="background: ${statusColor}20; color: ${statusColor}; padding: 0.375rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; text-transform: capitalize;">
                        ${lead.status.replace('_', ' ')}
                    </span>
                </div>
                
                <div style="background: #F9FAFB; padding: 1rem; border-radius: 0.5rem;">
                    <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">SOURCE</div>
                    <div style="font-weight: 600; text-transform: capitalize;">${lead.source}</div>
                </div>
                
                <div style="background: #F9FAFB; padding: 1rem; border-radius: 0.5rem;">
                    <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">DEVELOPMENT</div>
                    <div style="font-weight: 600;">${lead.development || 'Not specified'}</div>
                </div>
                
                <div style="background: #F9FAFB; padding: 1rem; border-radius: 0.5rem;">
                    <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">PLOT INTEREST</div>
                    <div style="font-weight: 600;">${lead.plotInterest ? `Plot ${lead.plotInterest}` : 'Not specified'}</div>
                </div>
                
                <div style="background: #F9FAFB; padding: 1rem; border-radius: 0.5rem;">
                    <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">BUDGET</div>
                    <div style="font-weight: 600;">${lead.budget ? '£' + parseInt(lead.budget).toLocaleString() : 'Not specified'}</div>
                </div>
                
                <div style="background: #F9FAFB; padding: 1rem; border-radius: 0.5rem;">
                    <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">CREATED</div>
                    <div style="font-weight: 600;">${new Date(lead.createdDate).toLocaleDateString()}</div>
                </div>
            </div>
            
            ${lead.notes ? `
                <div style="background: #F9FAFB; padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                    <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.5rem;">NOTES</div>
                    <p style="color: #374151; line-height: 1.6; margin: 0; white-space: pre-wrap;">${lead.notes}</p>
                </div>
            ` : ''}
            
            <div style="display: flex; gap: 1rem;">
                <button class="btn btn-primary" onclick="updateStatus('${lead.id}'); this.closest('.modal').remove();">
                    Update Status
                </button>
                <button class="btn btn-secondary" onclick="editLead('${lead.id}'); this.closest('.modal').remove();">
                    Edit Lead
                </button>
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove();">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Edit lead
function editLead(leadId) {
    const lead = allLeads.find(l => l.id === leadId);
    if (!lead) {
        showNotification('Lead not found', 'error');
        return;
    }
    
    // Populate form with lead data
    document.getElementById('leadName').value = lead.name;
    document.getElementById('leadEmail').value = lead.email;
    document.getElementById('leadPhone').value = lead.phone;
    document.getElementById('leadSource').value = lead.source;
    document.getElementById('leadDevelopment').value = lead.development || '';
    document.getElementById('leadPlot').value = lead.plotInterest || '';
    document.getElementById('leadBudget').value = lead.budget || '';
    document.getElementById('leadStatus').value = lead.status;
    document.getElementById('leadNotes').value = lead.notes || '';
    
    // Change form submission to update
    const form = document.getElementById('newLeadForm');
    form.onsubmit = function(e) {
        e.preventDefault();
        updateLead(leadId);
    };
    
    openNewLeadModal();
}

// Update lead
function updateLead(leadId) {
    const index = allLeads.findIndex(l => l.id === leadId);
    if (index === -1) {
        showNotification('Lead not found', 'error');
        return;
    }
    
    // Update lead data
    allLeads[index].name = document.getElementById('leadName').value;
    allLeads[index].email = document.getElementById('leadEmail').value;
    allLeads[index].phone = document.getElementById('leadPhone').value;
    allLeads[index].source = document.getElementById('leadSource').value;
    allLeads[index].development = document.getElementById('leadDevelopment').value;
    allLeads[index].plotInterest = document.getElementById('leadPlot').value;
    allLeads[index].budget = document.getElementById('leadBudget').value;
    allLeads[index].status = document.getElementById('leadStatus').value;
    allLeads[index].notes = document.getElementById('leadNotes').value;
    allLeads[index].lastContact = Date.now();
    
    localStorage.setItem('nhp_leads', JSON.stringify(allLeads));
    
    showNotification('Lead updated successfully', 'success');
    closeNewLeadModal();
    
    // Reset form submission
    document.getElementById('newLeadForm').onsubmit = submitLead;
    
    // Refresh data
    loadLeads();
    loadLeadsTable();
}

// Update status
function updateStatus(leadId) {
    const lead = allLeads.find(l => l.id === leadId);
    if (!lead) {
        showNotification('Lead not found', 'error');
        return;
    }
    
    // Create status update modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem;">Update Lead Status</h2>
            
            <form onsubmit="event.preventDefault(); saveStatus('${leadId}', this); this.closest('.modal').remove();">
                <div class="form-group">
                    <label>New Status</label>
                    <select id="newStatus" class="form-input" required>
                        <option value="new" ${lead.status === 'new' ? 'selected' : ''}>New</option>
                        <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                        <option value="viewing_scheduled" ${lead.status === 'viewing_scheduled' ? 'selected' : ''}>Viewing Scheduled</option>
                        <option value="offer_made" ${lead.status === 'offer_made' ? 'selected' : ''}>Offer Made</option>
                        <option value="converted" ${lead.status === 'converted' ? 'selected' : ''}>Converted</option>
                        <option value="lost" ${lead.status === 'lost' ? 'selected' : ''}>Lost</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Notes</label>
                    <textarea id="statusNotes" class="form-input" rows="3" placeholder="Add notes about this status change..."></textarea>
                </div>
                
                <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;">
                        Update Status
                    </button>
                    <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="this.closest('.modal').remove()">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Save status
function saveStatus(leadId, form) {
    const index = allLeads.findIndex(l => l.id === leadId);
    if (index === -1) {
        showNotification('Lead not found', 'error');
        return;
    }
    
    const newStatus = form.querySelector('#newStatus').value;
    const notes = form.querySelector('#statusNotes').value;
    
    allLeads[index].status = newStatus;
    allLeads[index].lastContact = Date.now();
    
    if (notes) {
        allLeads[index].notes = (allLeads[index].notes || '') + '\n\n' + 
            `[${new Date().toLocaleString()}] Status changed to ${newStatus}:\n${notes}`;
    }
    
    localStorage.setItem('nhp_leads', JSON.stringify(allLeads));
    
    showNotification('Status updated successfully', 'success');
    
    // Refresh data
    loadLeads();
    loadLeadsTable();
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
`;
document.head.appendChild(style);
