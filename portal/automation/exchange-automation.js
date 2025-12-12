// Exchange Countdown Automation Service
// Automatically sends reminder emails at 7, 3, and 1 days before exchange deadline

class ExchangeAutomation {
    constructor() {
        this.reminderThresholds = [7, 3, 1]; // Days before deadline to send reminders
        this.checkInterval = 3600000; // Check every hour (in milliseconds)
        this.isRunning = false;
    }

    // Start the automation service
    start() {
        if (this.isRunning) {
            console.log('Exchange automation already running');
            return;
        }

        console.log('Starting exchange countdown automation...');
        this.isRunning = true;
        
        // Run initial check
        this.checkExchangeDeadlines();
        
        // Set up recurring checks
        this.intervalId = setInterval(() => {
            this.checkExchangeDeadlines();
        }, this.checkInterval);
        
        // Store automation status
        localStorage.setItem('nhp_automation_status', JSON.stringify({
            isRunning: true,
            lastCheck: Date.now(),
            nextCheck: Date.now() + this.checkInterval
        }));
    }

    // Stop the automation service
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        
        localStorage.setItem('nhp_automation_status', JSON.stringify({
            isRunning: false,
            lastCheck: Date.now()
        }));
        
        console.log('Exchange automation stopped');
    }

    // Check all reservations for upcoming exchange deadlines
    checkExchangeDeadlines() {
        console.log('Checking exchange deadlines...', new Date().toLocaleString());
        
        const reservations = this.getAllReservations();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let remindersChecked = 0;
        let remindersSent = 0;
        
        reservations.forEach(reservation => {
            // Skip if already exchanged
            if (reservation.exchangeDate) {
                return;
            }
            
            // Calculate exchange deadline (28 days from reservation)
            const reservationDate = new Date(reservation.reservationDate);
            const exchangeDeadline = new Date(reservationDate);
            exchangeDeadline.setDate(exchangeDeadline.getDate() + 28);
            exchangeDeadline.setHours(0, 0, 0, 0);
            
            // Calculate days remaining
            const daysRemaining = Math.ceil((exchangeDeadline - today) / (1000 * 60 * 60 * 24));
            
            remindersChecked++;
            
            // Check if reminder should be sent
            if (this.shouldSendReminder(reservation, daysRemaining)) {
                this.sendExchangeReminder(reservation, daysRemaining, exchangeDeadline);
                remindersSent++;
            }
        });
        
        // Update automation status
        const status = {
            isRunning: this.isRunning,
            lastCheck: Date.now(),
            nextCheck: Date.now() + this.checkInterval,
            lastCheckStats: {
                reservationsChecked: remindersChecked,
                remindersSent: remindersSent
            }
        };
        
        localStorage.setItem('nhp_automation_status', JSON.stringify(status));
        
        console.log(`Check complete: ${remindersChecked} reservations checked, ${remindersSent} reminders sent`);
    }

    // Determine if reminder should be sent
    shouldSendReminder(reservation, daysRemaining) {
        // Check if days remaining matches a reminder threshold
        if (!this.reminderThresholds.includes(daysRemaining)) {
            return false;
        }
        
        // Get reminder history for this reservation
        const reminderHistory = this.getReminderHistory(reservation.id);
        
        // Check if reminder already sent for this threshold
        const alreadySent = reminderHistory.some(reminder => 
            reminder.daysRemaining === daysRemaining && 
            reminder.status === 'sent'
        );
        
        if (alreadySent) {
            console.log(`Reminder already sent for ${reservation.buyerName} at ${daysRemaining} days`);
            return false;
        }
        
        return true;
    }

    // Send exchange reminder email
    sendExchangeReminder(reservation, daysRemaining, exchangeDeadline) {
        console.log(`Sending ${daysRemaining}-day reminder to ${reservation.buyerName}`);
        
        // Load email service
        if (typeof EmailService === 'undefined') {
            console.error('EmailService not loaded');
            this.recordReminderAttempt(reservation.id, daysRemaining, 'failed', 'EmailService not available');
            return;
        }
        
        const emailService = new EmailService();
        
        // Prepare email data
        const emailData = {
            buyerName: reservation.buyerName,
            plotNumber: reservation.plotNumber,
            development: reservation.developmentName || 'Your Development',
            exchangeDeadline: exchangeDeadline.toLocaleDateString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            daysRemaining: daysRemaining,
            reservationDate: new Date(reservation.reservationDate).toLocaleDateString('en-GB'),
            reservationId: reservation.id,
            price: reservation.price ? `£${parseFloat(reservation.price).toLocaleString()}` : 'N/A',
            urgency: daysRemaining <= 3 ? 'critical' : daysRemaining <= 7 ? 'high' : 'normal'
        };
        
        // Recipients: buyer + solicitor + sales team
        const recipients = [reservation.buyerEmail];
        
        if (reservation.solicitorEmail) {
            recipients.push(reservation.solicitorEmail);
        }
        
        // Add sales team
        recipients.push('sales@newhomepack.com');
        
        // Add developer
        recipients.push('developer@newhomepack.com');
        
        try {
            // Send email using existing template
            emailService.send('exchangeReminder', recipients, emailData);
            
            // Record successful send
            this.recordReminderAttempt(reservation.id, daysRemaining, 'sent', null, emailData);
            
            // Create notification in system
            this.createSystemNotification(reservation, daysRemaining);
            
            console.log(`✅ Reminder sent successfully to ${recipients.join(', ')}`);
            
        } catch (error) {
            console.error('Error sending reminder:', error);
            this.recordReminderAttempt(reservation.id, daysRemaining, 'failed', error.message);
        }
    }

    // Record reminder attempt in history
    recordReminderAttempt(reservationId, daysRemaining, status, errorMessage = null, emailData = null) {
        const reminderHistory = this.getReminderHistory(reservationId);
        
        const attempt = {
            id: 'REM-' + Date.now(),
            reservationId: reservationId,
            daysRemaining: daysRemaining,
            status: status, // 'sent', 'failed', 'pending'
            timestamp: Date.now(),
            errorMessage: errorMessage,
            emailData: emailData
        };
        
        reminderHistory.push(attempt);
        
        localStorage.setItem(`nhp_reminders_${reservationId}`, JSON.stringify(reminderHistory));
        
        // Also add to global reminder log
        this.addToGlobalReminderLog(attempt);
    }

    // Get reminder history for a reservation
    getReminderHistory(reservationId) {
        const historyStr = localStorage.getItem(`nhp_reminders_${reservationId}`);
        return historyStr ? JSON.parse(historyStr) : [];
    }

    // Add to global reminder log
    addToGlobalReminderLog(attempt) {
        const logStr = localStorage.getItem('nhp_reminder_log');
        const log = logStr ? JSON.parse(logStr) : [];
        
        log.push(attempt);
        
        // Keep only last 1000 entries
        if (log.length > 1000) {
            log.splice(0, log.length - 1000);
        }
        
        localStorage.setItem('nhp_reminder_log', JSON.stringify(log));
    }

    // Create system notification
    createSystemNotification(reservation, daysRemaining) {
        const notifications = this.getSystemNotifications();
        
        const notification = {
            id: 'NOTIF-' + Date.now(),
            type: 'exchange_reminder',
            priority: daysRemaining <= 3 ? 'critical' : 'high',
            title: `Exchange Reminder Sent - ${daysRemaining} Days`,
            message: `Reminder sent to ${reservation.buyerName} for Plot ${reservation.plotNumber}`,
            reservationId: reservation.id,
            timestamp: Date.now(),
            read: false
        };
        
        notifications.unshift(notification);
        
        // Keep only last 100 notifications
        if (notifications.length > 100) {
            notifications.splice(100);
        }
        
        localStorage.setItem('nhp_notifications', JSON.stringify(notifications));
    }

    // Get system notifications
    getSystemNotifications() {
        const notifStr = localStorage.getItem('nhp_notifications');
        return notifStr ? JSON.parse(notifStr) : [];
    }

    // Get all reservations
    getAllReservations() {
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

    // Get automation status
    getStatus() {
        const statusStr = localStorage.getItem('nhp_automation_status');
        return statusStr ? JSON.parse(statusStr) : { isRunning: false };
    }

    // Get statistics
    getStatistics() {
        const reservations = this.getAllReservations();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const stats = {
            totalReservations: reservations.length,
            awaitingExchange: 0,
            criticalDeadlines: 0, // ≤3 days
            urgentDeadlines: 0,   // ≤7 days
            upcomingDeadlines: 0, // ≤14 days
            remindersSent: {
                today: 0,
                thisWeek: 0,
                total: 0
            },
            averageDaysToExchange: 0
        };
        
        const weekAgo = today.getTime() - (7 * 24 * 60 * 60 * 1000);
        const dayStart = new Date(today).setHours(0, 0, 0, 0);
        
        let totalDaysToExchange = 0;
        let exchangedCount = 0;
        
        reservations.forEach(res => {
            if (res.exchangeDate) {
                // Calculate days to exchange
                const days = Math.ceil((res.exchangeDate - res.reservationDate) / (1000 * 60 * 60 * 24));
                totalDaysToExchange += days;
                exchangedCount++;
            } else {
                stats.awaitingExchange++;
                
                // Calculate days remaining
                const reservationDate = new Date(res.reservationDate);
                const exchangeDeadline = new Date(reservationDate);
                exchangeDeadline.setDate(exchangeDeadline.getDate() + 28);
                const daysRemaining = Math.ceil((exchangeDeadline - today) / (1000 * 60 * 60 * 24));
                
                if (daysRemaining <= 3) stats.criticalDeadlines++;
                else if (daysRemaining <= 7) stats.urgentDeadlines++;
                else if (daysRemaining <= 14) stats.upcomingDeadlines++;
            }
        });
        
        if (exchangedCount > 0) {
            stats.averageDaysToExchange = Math.round(totalDaysToExchange / exchangedCount);
        }
        
        // Count reminders sent
        const logStr = localStorage.getItem('nhp_reminder_log');
        if (logStr) {
            const log = JSON.parse(logStr);
            stats.remindersSent.total = log.filter(r => r.status === 'sent').length;
            stats.remindersSent.today = log.filter(r => 
                r.status === 'sent' && r.timestamp >= dayStart
            ).length;
            stats.remindersSent.thisWeek = log.filter(r => 
                r.status === 'sent' && r.timestamp >= weekAgo
            ).length;
        }
        
        return stats;
    }

    // Manual trigger for testing
    triggerManualCheck() {
        console.log('Manual check triggered');
        this.checkExchangeDeadlines();
    }

    // Clear all reminder history (use with caution)
    clearReminderHistory() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('nhp_reminders_')) {
                keys.push(key);
            }
        }
        keys.forEach(key => localStorage.removeItem(key));
        localStorage.removeItem('nhp_reminder_log');
        console.log('Reminder history cleared');
    }
}

// Initialize automation on page load
let exchangeAutomation = null;

// Auto-start automation when email service is available
document.addEventListener('DOMContentLoaded', function() {
    // Wait for email service to load
    setTimeout(() => {
        exchangeAutomation = new ExchangeAutomation();
        exchangeAutomation.start();
        console.log('Exchange automation initialized');
    }, 1000);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExchangeAutomation;
}
