// Buyer Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    checkAuthWithRole('buyer');
    loadUserInfo();
    loadMortgageOfferCount();
});

function loadUserInfo() {
    const user = getCurrentUser();
    if (user) {
        if (document.getElementById('userName')) {
            document.getElementById('userName').textContent = user.name || user.email;
        }
        if (document.getElementById('welcomeName')) {
            const firstName = user.name ? user.name.split(' ')[0] : user.email.split('@')[0];
            document.getElementById('welcomeName').textContent = firstName;
        }
    }
}

function loadMortgageOfferCount() {
    const connections = JSON.parse(localStorage.getItem('nhp_mortgage_connections') || '[]');
    const count = connections.length;
    
    if (document.getElementById('mortgageOfferCount')) {
        document.getElementById('mortgageOfferCount').textContent = count;
    }
}
