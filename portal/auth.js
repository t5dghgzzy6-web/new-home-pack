// Authentication handling (MVP - client-side demo, replace with real auth later)

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    // Demo credentials for MVP
    const demoUsers = {
        'developer@demo.com': { password: 'demo123', role: 'developer', name: 'Demo Developer' },
        'sales@demo.com': { password: 'demo123', role: 'sales', name: 'Sales Manager' },
        'solicitor@demo.com': { password: 'demo123', role: 'solicitor', name: 'Legal Team' },
        'buyer@demo.com': { password: 'demo123', role: 'buyer', name: 'John Smith' }
    };

    // Login handler
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const remember = document.querySelector('input[name="remember"]').checked;

            // Demo authentication
            if (demoUsers[email] && demoUsers[email].password === password) {
                const user = demoUsers[email];
                
                // Store session
                const storage = remember ? localStorage : sessionStorage;
                storage.setItem('nhp_user', JSON.stringify({
                    email,
                    role: user.role,
                    name: user.name,
                    loginTime: new Date().toISOString()
                }));

                // Check for redirect parameters
                const urlParams = new URLSearchParams(window.location.search);
                const plotId = urlParams.get('plot');
                const action = urlParams.get('action');
                
                if (plotId && action === 'download') {
                    // Redirect back to plot detail to trigger download
                    window.location.href = `../plot-detail.html?id=${plotId}&autodownload=true`;
                    return;
                }
                
                if (plotId && action === 'reserve') {
                    // Redirect to reservation form
                    window.location.href = `buyer/reserve.html?plot=${plotId}`;
                    return;
                }
                
                // Redirect to appropriate dashboard based on role
                redirectToDashboard(user.role);
            } else {
                alert('Invalid credentials. Try:\nbuyer@demo.com / demo123\ndeveloper@demo.com / demo123\nsales@demo.com / demo123\nsolicitor@demo.com / demo123');
            }
        });
    }

    // Signup handler
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(signupForm);
            const data = Object.fromEntries(formData);
            
            // Store the new user (in production, this would be an API call)
            const newUser = {
                email: data.email,
                name: `${data.firstName} ${data.lastName}`,
                role: data.accountType,
                company: data.company,
                phone: data.phone,
                createdAt: new Date().toISOString(),
                id: 'user_' + Date.now()
            };
            
            // Get redirect parameters
            const urlParams = new URLSearchParams(window.location.search);
            const plotId = urlParams.get('plot');
            const action = urlParams.get('action');
            
            // Store user in session
            sessionStorage.setItem('nhp_user', JSON.stringify(newUser));
            
            // Store in local registry for demo purposes
            const users = JSON.parse(localStorage.getItem('nhp_registered_users') || '[]');
            users.push(newUser);
            localStorage.setItem('nhp_registered_users', JSON.stringify(users));
            
            // Redirect based on user type and any pending actions
            if (plotId && action === 'download') {
                window.location.href = `../plot-detail.html?id=${plotId}&autodownload=true`;
            } else if (plotId && action === 'reserve') {
                window.location.href = `buyer/reserve.html?plot=${plotId}`;
            } else {
                // Redirect to appropriate dashboard based on account type
                redirectToDashboard(data.accountType);
            }
        });
    }
});

// Check authentication
function checkAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '../login.html';
        return null;
    }
    return user;
}

// Check authentication with role requirement
function checkAuthWithRole(requiredRole) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = '../login.html';
        return null;
    }
    
    // Check if user has the required role
    if (user.role !== requiredRole) {
        // Redirect to their correct dashboard
        alert(`Access denied. This area is for ${requiredRole}s only. Redirecting to your dashboard...`);
        redirectToDashboard(user.role);
        return null;
    }
    
    return user;
}

// Redirect to appropriate dashboard based on role
function redirectToDashboard(role) {
    const dashboardMap = {
        'buyer': 'buyer/dashboard.html',
        'developer': 'developer/dashboard.html',
        'sales': 'sales/dashboard.html',
        'solicitor': 'solicitor/dashboard.html',
        'admin': 'admin/payments.html'
    };
    
    const dashboard = dashboardMap[role] || 'buyer/dashboard.html';
    window.location.href = dashboard;
}

// Get current user
function getCurrentUser() {
    const sessionUser = sessionStorage.getItem('nhp_user');
    const localUser = localStorage.getItem('nhp_user');
    
    if (sessionUser) return JSON.parse(sessionUser);
    if (localUser) return JSON.parse(localUser);
    
    return null;
}

// Logout
function logout() {
    sessionStorage.removeItem('nhp_user');
    localStorage.removeItem('nhp_user');
    window.location.href = '../login.html';
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { checkAuth, getCurrentUser, logout };
}
