// Developer Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const user = checkAuth();
    if (!user) return;

    // Display user name
    const userName = document.getElementById('userName');
    if (userName && user.name) {
        userName.textContent = user.name;
    }

    // Load dashboard data (MVP - using demo data)
    loadDashboardStats();
    loadRecentActivity();
});

function loadDashboardStats() {
    // In production, this would fetch from API
    // For MVP, we're using demo data already in HTML
    console.log('Dashboard stats loaded');
}

function loadRecentActivity() {
    // In production, this would fetch from API
    // For MVP, we're using demo data already in HTML
    console.log('Recent activity loaded');
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadDashboardStats, loadRecentActivity };
}
