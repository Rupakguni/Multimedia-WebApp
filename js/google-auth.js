/**
 * Google Sign-In Authentication
 */
let currentUser = null;

// Handle Google Sign-In response
function handleCredentialResponse(response) {
    // Decode the JWT token to get user info
    const responsePayload = decodeJwtResponse(response.credential);
    
    currentUser = {
        id: responsePayload.sub,
        name: responsePayload.name,
        email: responsePayload.email,
        picture: responsePayload.picture,
        given_name: responsePayload.given_name,
        family_name: responsePayload.family_name
    };
    
    // Store user info in localStorage
    localStorage.setItem('googleUser', JSON.stringify(currentUser));
    
    // Update UI to show logged in state
    updateAuthUI();
    
    console.log('User signed in:', currentUser);
}

// Decode JWT token
function decodeJwtResponse(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
}

// Initialize Google Sign-In when library loads
function onGoogleLibraryLoad() {
    google.accounts.id.initialize({
        client_id: '971821874994-2ceikgaib4jb1t1lbniq4s8l983ofrq2.apps.googleusercontent.com',
        callback: handleCredentialResponse
    });
    
    // Update UI now that Google is loaded
    updateAuthUI();
}

// Update authentication UI
function updateAuthUI() {
    const authContainer = document.querySelector('.auth-container');
    const user = JSON.parse(localStorage.getItem('googleUser'));
    
    if (user) {
        // Show user profile with dropdown
        authContainer.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-link text-decoration-none text-white dropdown-toggle d-flex align-items-center" 
                        type="button" 
                        id="userDropdown" 
                        data-bs-toggle="dropdown" 
                        aria-expanded="false">
                    <img src="${user.picture}" alt="${user.name}" class="rounded-circle me-2" style="width: 32px; height: 32px;">
                    <span class="d-none d-lg-inline">${user.given_name}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    <li><h6 class="dropdown-header">${user.name}</h6></li>
                    <li><span class="dropdown-item-text small text-muted">${user.email}</span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="signOut(event)">Cerrar sesión</a></li>
                </ul>
            </div>
        `;
    } else {
        // Show sign-in button with Google API
        authContainer.innerHTML = `<div id="google-signin-btn"></div>`;
        
        // Render the button since Google is already initialized
        google.accounts.id.renderButton(
            document.getElementById('google-signin-btn'),
            { 
                type: 'icon',
                shape: 'circle',
                theme: 'outline',
                size: 'medium'
            }
        );
    }
}

// Sign out function
function signOut(event) {
    if (event) event.preventDefault();
    
    // Clear user data
    currentUser = null;
    localStorage.removeItem('googleUser');
    
    // Update UI
    updateAuthUI();
    
    console.log('User signed out');
}

// Initialize auth UI when page loads
document.addEventListener('DOMContentLoaded', function() {
    // If user is already logged in, show profile immediately
    const user = JSON.parse(localStorage.getItem('googleUser'));
    if (user) {
        currentUser = user;
        updateAuthUI();
    }
    // If Google library is already loaded, initialize
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        onGoogleLibraryLoad();
    }
    // Otherwise, onGoogleLibraryLoad will be called when script loads
});
