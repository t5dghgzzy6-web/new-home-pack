// Authentication handling (MVP - client-side demo, replace with real auth later)

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    // Demo credentials for MVP
    const demoUsers = {
        'developer@demo.com': { password: 'demo123', role: 'developer', name: 'Demo Developer' },
        'sales@demo.com': { password: 'demo123', role: 'sales', name: 'Sales Manager' },
        'solicitor@demo.com': { password: 'demo123', role: 'solicitor', name: 'Legal Team' }
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

                // Show role selection or redirect
                if (email === 'developer@demo.com') {
                    window.location.href = 'developer/dashboard.html';
                } else if (email === 'sales@demo.com') {
                    window.location.href = 'sales/dashboard.html';
                } else if (email === 'solicitor@demo.com') {
                    window.location.href = 'solicitor/dashboard.html';
                }
            } else {
                alert('Invalid credentials. Try:\ndeveloper@demo.com / demo123\nsales@demo.com / demo123\nsolicitor@demo.com / demo123');
            }
        });
    }

    // Signup handler
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(signupForm);
            const data = Object.fromEntries(formData);

            // For MVP, just redirect to login
            alert('Account created! Please login with your credentials.');
            window.location.href = 'login.html';
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
