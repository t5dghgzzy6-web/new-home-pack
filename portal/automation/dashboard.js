// Automation Dashboard JavaScript

let currentFilter = 'all';
let automation = null;

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Automation dashboard loaded');
    
    // Wait for automation to initialize
    setTimeout(() => {
        automation = exchangeAutomation;
        updateDashboard();
        
        // Refresh dashboard every 30 seconds
        setInterval(updateDashboard, 30000);
    }, 1500);
});

// Update entire dashboard
function updateDashboard() {
    updateStatusBanner();
    updateStatistics();
    updateUpcomingReminders();
    updateReminderLog();
}

// Update status banner
function updateStatusBanner() {
    if (!automation) return;
    
    const status = automation.getStatus();
    const statusIndicator = document.getElementById('statusIndicator');
    const statusTitle = document.getElementById('statusTitle');
    const statusText = document.getElementById('statusText');
    const lastCheckText = document.getElementById('lastCheckText');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    if (status.isRunning) {
        statusIndicator.classList.remove('stopped');
        statusTitle.textContent = '✅ Automation Running';
        statusText.textContent = 'System is actively monitoring exchange deadlines';
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
    } else {
        statusIndicator.classList.add('stopped');
        statusTitle.textContent = '⏸️ Automation Stopped';
        statusText.textContent = 'System is not monitoring deadlines';
        startBtn.style.display = 'inline-block';
        stopBtn.style.display = 'none';
    }
    
    if (status.lastCheck) {
        const lastCheck = new Date(status.lastCheck);
        lastCheckText.textContent = `Last check: ${lastCheck.toLocaleString()}`;
        
        if (status.nextCheck) {
            const nextCheck = new Date(status.nextCheck);
            const minutesUntilNext = Math.round((nextCheck - Date.now()) / (1000 * 60));
            lastCheckText.textContent += ` • Next check in ${minutesUntilNext} minutes`;
        }
    }
}

// Update statistics
function updateStatistics() {
    if (!automation) return;
    
    const stats = automation.getStatistics();
    
    document.getElementById('awaitingCount').textContent = stats.awaitingExchange;
    document.getElementById('criticalCount').textContent = stats.criticalDeadlines;
    document.getElementById('urgentCount').textContent = stats.urgentDeadlines;
    document.getElementById('todayCount').textContent = stats.remindersSent.today;
    document.getElementById('weekCount').textContent = `${stats.remindersSent.thisWeek} this week`;
    document.getElementById('totalCount').textContent = stats.remindersSent.total;
    document.getElementById('avgDays').textContent = stats.averageDaysToExchange > 0 ? stats.averageDaysToExchange : '-';
}

// Update upcoming reminders
function updateUpcomingReminders() {
    if (!automation) return;
    
    const container = document.getElementById('upcomingReminders');
    const reservations = automation.getAllReservations();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate upcoming reminders
    const upcoming = [];
    
    reservations.forEach(reservation => {
        if (reservation.exchangeDate) return;
        
        const reservationDate = new Date(reservation.reservationDate);
        const exchangeDeadline = new Date(reservationDate);
        exchangeDeadline.setDate(exchangeDeadline.getDate() + 28);
        exchangeDeadline.setHours(0, 0, 0, 0);
        
        const daysRemaining = Math.ceil((exchangeDeadline - today) / (1000 * 60 * 60 * 24));
        
        // Check if reminder will be sent soon
        const reminderHistory = automation.getReminderHistory(reservation.id);
        
        [7, 3, 1].forEach(threshold => {
            if (daysRemaining <= threshold + 2 && daysRemaining >= threshold - 1) {
                const alreadySent = reminderHistory.some(r => 
                    r.daysRemaining === threshold && r.status === 'sent'
                );
                
                if (!alreadySent) {
                    upcoming.push({
                        reservation,
                        daysRemaining,
                        threshold,
                        exchangeDeadline,
                        willSendOn: daysRemaining === threshold ? 'Today' : 
                                   daysRemaining > threshold ? `In ${daysRemaining - threshold} days` :
                                   'Overdue'
                    });
                }
            }
        });
    });
    
    // Sort by days remaining
    upcoming.sort((a, b) => a.daysRemaining - b.daysRemaining);
    
    if (upcoming.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <p>No upcoming reminders in the next 2 days</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    upcoming.forEach(item => {
        const urgency = item.daysRemaining <= 3 ? 'critical' : 
                       item.daysRemaining <= 7 ? 'urgent' : '';
        
        const badgeClass = item.daysRemaining <= 3 ? 'critical' : 
                          item.daysRemaining <= 7 ? 'urgent' : '';
        
        const badgeText = item.daysRemaining <= 3 ? '🔴 CRITICAL' : 
                         item.daysRemaining <= 7 ? '🟠 URGENT' : '';
        
        html += `
            <div class="upcoming-item ${urgency}">
                <div class="upcoming-title">
                    ${item.reservation.buyerName} - Plot ${item.reservation.plotNumber}
                    ${badgeText ? `<span class="badge ${badgeClass}">${badgeText}</span>` : ''}
                </div>
                <div class="upcoming-details">
                    ${item.threshold}-day reminder will be sent ${item.willSendOn} 
                    (${item.daysRemaining} days until exchange deadline: ${item.exchangeDeadline.toLocaleDateString()})
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Update reminder log
function updateReminderLog() {
    const logStr = localStorage.getItem('nhp_reminder_log');
    const container = document.getElementById('reminderLog');
    
    if (!logStr) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>No reminders sent yet</p>
            </div>
        `;
        return;
    }
    
    let log = JSON.parse(logStr);
    
    // Apply filters
    const today = new Date().setHours(0, 0, 0, 0);
    
    if (currentFilter === 'sent') {
        log = log.filter(entry => entry.status === 'sent');
    } else if (currentFilter === 'failed') {
        log = log.filter(entry => entry.status === 'failed');
    } else if (currentFilter === 'today') {
        log = log.filter(entry => entry.timestamp >= today);
    }
    
    // Sort by timestamp (newest first)
    log.sort((a, b) => b.timestamp - a.timestamp);
    
    if (log.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <p>No reminders match the selected filter</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    log.forEach(entry => {
        const timestamp = new Date(entry.timestamp);
        const reservation = getReservation(entry.reservationId);
        
        if (!reservation) return;
        
        const statusClass = entry.status;
        const statusText = entry.status === 'sent' ? '✅ Sent' : 
                          entry.status === 'failed' ? '❌ Failed' : 
                          '⏳ Pending';
        
        html += `
            <div class="log-entry">
                <div class="log-info">
                    <div class="log-title">
                        ${reservation.buyerName} - Plot ${reservation.plotNumber} 
                        (${entry.daysRemaining}-day reminder)
                    </div>
                    <div class="log-meta">
                        ${timestamp.toLocaleString()}
                        ${entry.errorMessage ? `<br>Error: ${entry.errorMessage}` : ''}
                    </div>
                </div>
                <div class="log-status ${statusClass}">${statusText}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Get reservation by ID
function getReservation(reservationId) {
    const reservationStr = localStorage.getItem(`nhp_reservation_${reservationId}`);
    return reservationStr ? JSON.parse(reservationStr) : null;
}

// Control functions
function startAutomation() {
    if (automation) {
        automation.start();
        updateDashboard();
    }
}

function stopAutomation() {
    if (automation) {
        automation.stop();
        updateDashboard();
    }
}

function manualCheck() {
    if (automation) {
        automation.triggerManualCheck();
        setTimeout(updateDashboard, 2000); // Refresh after check completes
    }
}

function filterLog(filter) {
    currentFilter = filter;
    
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    updateReminderLog();
}

function refreshLog() {
    updateDashboard();
}

// Add demo data for testing (remove in production)
function addDemoData() {
    // Only add if no reservations exist
    const existing = localStorage.getItem('nhp_reservation_RES-1');
    if (existing) {
        console.log('Demo data already exists');
        return;
    }
    
    const today = new Date();
    
    // Demo reservation 1 - 7 days until deadline
    const res1 = {
        id: 'RES-1',
        reservationDate: new Date(today.getTime() - (21 * 24 * 60 * 60 * 1000)).getTime(),
        buyerName: 'John Smith',
        buyerEmail: 'john.smith@example.com',
        plotNumber: '12',
        developmentName: 'Riverside Gardens',
        price: 425000,
        solicitorEmail: 'solicitor@lawfirm.com'
    };
    
    // Demo reservation 2 - 3 days until deadline
    const res2 = {
        id: 'RES-2',
        reservationDate: new Date(today.getTime() - (25 * 24 * 60 * 60 * 1000)).getTime(),
        buyerName: 'Sarah Johnson',
        buyerEmail: 'sarah.j@example.com',
        plotNumber: '8',
        developmentName: 'Meadow View',
        price: 385000,
        solicitorEmail: 'solicitor@lawfirm.com'
    };
    
    // Demo reservation 3 - 1 day until deadline
    const res3 = {
        id: 'RES-3',
        reservationDate: new Date(today.getTime() - (27 * 24 * 60 * 60 * 1000)).getTime(),
        buyerName: 'Michael Brown',
        buyerEmail: 'mbrown@example.com',
        plotNumber: '15',
        developmentName: 'Oak Heights',
        price: 475000,
        solicitorEmail: 'solicitor@lawfirm.com'
    };
    
    localStorage.setItem('nhp_reservation_RES-1', JSON.stringify(res1));
    localStorage.setItem('nhp_reservation_RES-2', JSON.stringify(res2));
    localStorage.setItem('nhp_reservation_RES-3', JSON.stringify(res3));
    
    console.log('Demo data added');
    location.reload();
}

// Export for console testing
window.addDemoData = addDemoData;
window.clearDemoData = function() {
    ['RES-1', 'RES-2', 'RES-3'].forEach(id => {
        localStorage.removeItem(`nhp_reservation_${id}`);
    });
    if (automation) {
        automation.clearReminderHistory();
    }
    location.reload();
};
