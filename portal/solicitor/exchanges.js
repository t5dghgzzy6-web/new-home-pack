// Solicitor Exchange Tracking JavaScript
// Monitor exchange deadlines and completion dates

// Check authentication
checkAuth('solicitor');

let allCases = [];
let timelineFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadUserInfo();
    loadData();
    updateStats();
    loadCriticalAlert();
    loadExchangeTimeline();
    loadCompletionTracker();
    
    // Set today's date as minimum for date inputs
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('exchangeDate').setAttribute('max', today);
    document.getElementById('exchangeDate').value = today;
    
    // Set completion date minimum to today
    document.getElementById('completionDate').setAttribute('min', today);
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
}

// Update statistics
function updateStats() {
    const awaiting = allCases.filter(c => !c.exchangeDate).length;
    const exchanged = allCases.filter(c => c.exchangeDate).length;
    
    // Calculate critical exchanges (≤7 days)
    let critical = 0;
    allCases.forEach(c => {
        if (!c.exchangeDate) {
            const daysRemaining = calculateDaysRemaining(c.reservationDate);
            if (daysRemaining <= 7) critical++;
        }
    });
    
    document.getElementById('awaitingExchange').textContent = awaiting;
    document.getElementById('criticalExchanges').textContent = critical;
    document.getElementById('exchangedCount').textContent = exchanged;
    
    // Calculate average days to exchange
    const exchangedCases = allCases.filter(c => c.exchangeDate);
    if (exchangedCases.length > 0) {
        let totalDays = 0;
        exchangedCases.forEach(c => {
            const reservationDate = new Date(c.reservationDate);
            const exchangeDate = new Date(c.exchangeDate);
            const days = Math.ceil((exchangeDate - reservationDate) / (1000 * 60 * 60 * 24));
            totalDays += days;
        });
        const avgDays = Math.round(totalDays / exchangedCases.length);
        document.getElementById('avgDaysToExchange').textContent = `${avgDays}d`;
    }
}

// Load critical alert
function loadCriticalAlert() {
    const criticalCases = [];
    
    allCases.forEach(c => {
        if (!c.exchangeDate) {
            const daysRemaining = calculateDaysRemaining(c.reservationDate);
            if (daysRemaining <= 7) {
                criticalCases.push({ ...c, daysRemaining });
            }
        }
    });
    
    const container = document.getElementById('criticalAlert');
    
    if (criticalCases.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    // Sort by urgency
    criticalCases.sort((a, b) => a.daysRemaining - b.daysRemaining);
    
    let html = `
        <div style="background: linear-gradient(135deg, #FEE2E2 0%, #FEF3C7 100%); border: 2px solid #DC2626; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 2rem;">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <span style="font-size: 2rem;">🚨</span>
                <div>
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: #DC2626; margin: 0;">
                        Critical Exchange Deadlines
                    </h3>
                    <p style="color: #991B1B; font-size: 0.875rem; margin: 0;">
                        ${criticalCases.length} ${criticalCases.length === 1 ? 'case requires' : 'cases require'} immediate attention
                    </p>
                </div>
            </div>
            <div style="display: grid; gap: 0.75rem;">
    `;
    
    criticalCases.forEach(c => {
        const reservationDate = new Date(c.reservationDate);
        const deadline = new Date(reservationDate);
        deadline.setDate(deadline.getDate() + 28);
        
        let urgencyColor = c.daysRemaining <= 3 ? '#DC2626' : '#F59E0B';
        let urgencyText = c.daysRemaining <= 3 ? '🔴 CRITICAL' : '🟠 URGENT';
        
        html += `
            <div style="background: white; border-radius: 0.5rem; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 600; margin-bottom: 0.25rem;">
                        <span style="color: ${urgencyColor}; margin-right: 0.5rem;">${urgencyText}</span>
                        Plot ${c.plotNumber} - ${c.buyerName}
                    </div>
                    <div style="font-size: 0.875rem; color: #6B7280;">
                        Deadline: ${deadline.toLocaleDateString()} (${c.daysRemaining} days remaining)
                    </div>
                </div>
                <button class="btn btn-primary btn-small" onclick="recordExchange('${c.plotNumber}')">
                    Record Exchange
                </button>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Load exchange timeline
function loadExchangeTimeline() {
    const container = document.getElementById('exchangeTimeline');
    
    // Filter cases
    let filtered = allCases;
    if (timelineFilter === 'pending') {
        filtered = allCases.filter(c => !c.exchangeDate);
    } else if (timelineFilter === 'critical') {
        filtered = allCases.filter(c => {
            if (c.exchangeDate) return false;
            const daysRemaining = calculateDaysRemaining(c.reservationDate);
            return daysRemaining <= 7;
        });
    } else if (timelineFilter === 'urgent') {
        filtered = allCases.filter(c => {
            if (c.exchangeDate) return false;
            const daysRemaining = calculateDaysRemaining(c.reservationDate);
            return daysRemaining <= 14;
        });
    } else if (timelineFilter === 'completed') {
        filtered = allCases.filter(c => c.exchangeDate);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <h3 class="empty-state-title">No Cases Found</h3>
                <p class="empty-state-text">No cases match the selected filter.</p>
            </div>
        `;
        return;
    }
    
    // Sort by urgency / date
    filtered.sort((a, b) => {
        if (!a.exchangeDate && !b.exchangeDate) {
            const daysA = calculateDaysRemaining(a.reservationDate);
            const daysB = calculateDaysRemaining(b.reservationDate);
            return daysA - daysB;
        }
        if (a.exchangeDate && !b.exchangeDate) return 1;
        if (!a.exchangeDate && b.exchangeDate) return -1;
        return b.exchangeDate - a.exchangeDate;
    });
    
    let html = '<div style="padding: 1.5rem;">';
    
    filtered.forEach(c => {
        const reservationDate = new Date(c.reservationDate);
        const deadline = new Date(reservationDate);
        deadline.setDate(deadline.getDate() + 28);
        
        let statusColor, statusBg, statusIcon, statusText, daysRemaining;
        
        if (c.exchangeDate) {
            statusColor = '#10B981';
            statusBg = '#D1FAE5';
            statusIcon = '✅';
            statusText = 'Exchanged';
            const actualDays = Math.ceil((new Date(c.exchangeDate) - reservationDate) / (1000 * 60 * 60 * 24));
            daysRemaining = `Exchanged in ${actualDays} days`;
        } else {
            daysRemaining = calculateDaysRemaining(c.reservationDate);
            
            if (daysRemaining <= 3) {
                statusColor = '#DC2626';
                statusBg = '#FEE2E2';
                statusIcon = '🔴';
                statusText = 'CRITICAL';
            } else if (daysRemaining <= 7) {
                statusColor = '#F59E0B';
                statusBg = '#FEF3C7';
                statusIcon = '🟠';
                statusText = 'URGENT';
            } else if (daysRemaining <= 14) {
                statusColor = '#3B82F6';
                statusBg = '#DBEAFE';
                statusIcon = '🔵';
                statusText = 'ACTIVE';
            } else {
                statusColor = '#10B981';
                statusBg = '#D1FAE5';
                statusIcon = '🟢';
                statusText = 'ON TRACK';
            }
            
            daysRemaining = `${daysRemaining} days remaining`;
        }
        
        html += `
            <div class="timeline-item">
                <div class="timeline-dot" style="background: ${statusBg}; color: ${statusColor};">
                    ${statusIcon}
                </div>
                <div style="background: white; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                        <div>
                            <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem;">
                                Plot ${c.plotNumber} - ${c.buyerName}
                            </h3>
                            <div style="font-size: 0.875rem; color: #6B7280;">
                                ${c.developmentName || 'Development'} • Reserved ${reservationDate.toLocaleDateString()}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <span style="background: ${statusBg}; color: ${statusColor}; padding: 0.375rem 0.75rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 600;">
                                ${statusText}
                            </span>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                        <div style="background: #F9FAFB; padding: 1rem; border-radius: 0.5rem;">
                            <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">RESERVATION DATE</div>
                            <div style="font-weight: 600;">${reservationDate.toLocaleDateString()}</div>
                        </div>
                        <div style="background: #F9FAFB; padding: 1rem; border-radius: 0.5rem;">
                            <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">EXCHANGE DEADLINE</div>
                            <div style="font-weight: 600; color: ${c.exchangeDate ? '#10B981' : statusColor};">
                                ${c.exchangeDate ? new Date(c.exchangeDate).toLocaleDateString() : deadline.toLocaleDateString()}
                            </div>
                        </div>
                        <div style="background: #F9FAFB; padding: 1rem; border-radius: 0.5rem;">
                            <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">STATUS</div>
                            <div style="font-weight: 600; color: ${statusColor};">${daysRemaining}</div>
                        </div>
                        ${c.completionDate ? `
                            <div style="background: #F9FAFB; padding: 1rem; border-radius: 0.5rem;">
                                <div style="font-size: 0.75rem; color: #6B7280; margin-bottom: 0.25rem;">COMPLETION DATE</div>
                                <div style="font-weight: 600;">${new Date(c.completionDate).toLocaleDateString()}</div>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${!c.exchangeDate ? `
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-primary btn-small" onclick="recordExchange('${c.plotNumber}')">
                                Record Exchange
                            </button>
                            <button class="btn btn-secondary btn-small" onclick="viewCase('${c.id}')">
                                View Details
                            </button>
                        </div>
                    ` : `
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-secondary btn-small" onclick="viewCase('${c.id}')">
                                View Details
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
}

// Load completion tracker
function loadCompletionTracker() {
    const container = document.getElementById('completionTracker');
    
    const exchangedCases = allCases.filter(c => c.exchangeDate);
    
    if (exchangedCases.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🤝</div>
                <h3 class="empty-state-title">No Exchanges Yet</h3>
                <p class="empty-state-text">Completion dates will be tracked here after exchange.</p>
            </div>
        `;
        return;
    }
    
    // Sort by completion date
    exchangedCases.sort((a, b) => {
        if (!a.completionDate) return 1;
        if (!b.completionDate) return -1;
        return new Date(a.completionDate) - new Date(b.completionDate);
    });
    
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Plot</th>
                    <th>Buyer</th>
                    <th>Exchange Date</th>
                    <th>Completion Date</th>
                    <th>Days Until Move</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    exchangedCases.forEach(c => {
        const exchangeDate = new Date(c.exchangeDate);
        const completionDate = c.completionDate ? new Date(c.completionDate) : null;
        
        let daysUntilMove = '-';
        let statusBadge = '<span class="status-badge status-completed">Exchanged</span>';
        
        if (completionDate) {
            const today = new Date();
            const daysRemaining = Math.ceil((completionDate - today) / (1000 * 60 * 60 * 24));
            
            if (daysRemaining < 0) {
                daysUntilMove = 'Completed';
                statusBadge = '<span class="status-badge status-completed">✅ Completed</span>';
            } else if (daysRemaining === 0) {
                daysUntilMove = 'Today';
                statusBadge = '<span class="status-badge status-urgent">🎉 Today!</span>';
            } else if (daysRemaining <= 7) {
                daysUntilMove = `${daysRemaining} days`;
                statusBadge = '<span class="status-badge status-pending">Coming Soon</span>';
            } else {
                daysUntilMove = `${daysRemaining} days`;
                statusBadge = '<span class="status-badge status-active">Scheduled</span>';
            }
        }
        
        html += `
            <tr>
                <td><strong>Plot ${c.plotNumber}</strong></td>
                <td>${c.buyerName}</td>
                <td>${exchangeDate.toLocaleDateString()}</td>
                <td>${completionDate ? completionDate.toLocaleDateString() : 'Not Set'}</td>
                <td><strong>${daysUntilMove}</strong></td>
                <td>${statusBadge}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Filter timeline
function filterTimeline() {
    timelineFilter = document.getElementById('timelineFilter').value;
    loadExchangeTimeline();
}

// Calculate days remaining until exchange deadline
function calculateDaysRemaining(reservationDate) {
    const reservation = new Date(reservationDate);
    const deadline = new Date(reservation);
    deadline.setDate(deadline.getDate() + 28);
    const today = new Date();
    return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
}

// Record exchange
function recordExchange(plotNumber) {
    document.getElementById('exchangePlotNumber').value = plotNumber;
    document.getElementById('recordExchangeModal').style.display = 'flex';
}

function closeExchangeModal() {
    document.getElementById('recordExchangeModal').style.display = 'none';
    document.getElementById('recordExchangeForm').reset();
}

function submitExchange(event) {
    event.preventDefault();
    
    const plotNumber = document.getElementById('exchangePlotNumber').value;
    const exchangeDate = document.getElementById('exchangeDate').value;
    const completionDate = document.getElementById('completionDate').value;
    const notes = document.getElementById('exchangeNotes').value;
    
    // Find and update the case
    const caseData = allCases.find(c => c.plotNumber === plotNumber);
    if (!caseData) {
        showNotification('Case not found', 'error');
        return;
    }
    
    // Update case with exchange details
    caseData.exchangeDate = new Date(exchangeDate).getTime();
    caseData.completionDate = new Date(completionDate).getTime();
    if (notes) {
        caseData.exchangeNotes = notes;
    }
    
    // Save to localStorage
    localStorage.setItem(`nhp_reservation_${caseData.id}`, JSON.stringify(caseData));
    
    showNotification('Exchange recorded successfully', 'success');
    closeExchangeModal();
    
    // Refresh data
    loadData();
    updateStats();
    loadCriticalAlert();
    loadExchangeTimeline();
    loadCompletionTracker();
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

function viewCase(caseId) {
    window.location.href = `case-details.html?id=${caseId}`;
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
