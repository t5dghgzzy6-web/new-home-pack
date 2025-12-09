// Buyer Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    checkAuthWithRole('buyer');
    loadUserInfo();
    loadMortgageOfferCount();
    loadDocumentCount();
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

function loadDocumentCount() {
    const user = getCurrentUser();
    const allDocuments = JSON.parse(localStorage.getItem('plot_documents') || '[]');
    
    // Filter to buyer documents for current user
    const userDocuments = allDocuments.filter(doc => 
        doc.category === 'buyer' && 
        doc.uploadedBy === (user?.email || 'buyer@demo.com')
    );
    
    const requiredCount = 6; // Total required documents
    const uploadedCount = userDocuments.length;
    
    if (document.getElementById('documentsCount')) {
        document.getElementById('documentsCount').textContent = `${uploadedCount}/${requiredCount}`;
    }
}
