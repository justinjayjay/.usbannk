/* =========================================
   Alder Banking Dashboard Logic
   ========================================= */

// --- State Management ---
const state = {
    balances: {
        checking: 527450.75,
        savings: 198378.34,
        credit: 9940.50
    },
    balancesVisible: true
};

// --- DOM Elements (Populated on load) ---
let totalDepositsEl, checkingBalanceEl, savingsBalanceEl, creditBalanceEl;
let eyeOpenIcon, eyeClosedIcon, popupModal;

// --- Utility Functions ---

/**
 * Format a number as USD currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Calculate total deposits (Checking + Savings)
 */
function calculateTotalDeposits() {
    return state.balances.checking + state.balances.savings;
}

/**
 * Update all balance displays on the UI
 */
function updateBalancesUI() {
    const total = calculateTotalDeposits();
    
    if (!totalDepositsEl) return;

    if (state.balancesVisible) {
        totalDepositsEl.textContent = formatCurrency(total);
        checkingBalanceEl.textContent = formatCurrency(state.balances.checking);
        savingsBalanceEl.textContent = formatCurrency(state.balances.savings);
        creditBalanceEl.textContent = formatCurrency(state.balances.credit);
    } else {
        totalDepositsEl.textContent = '••••••';
        checkingBalanceEl.textContent = '••••••';
        savingsBalanceEl.textContent = '••••••';
        creditBalanceEl.textContent = '••••••';
    }
}

/**
 * Update the greeting date and time dynamically based on the user's local system
 */
function updateDynamicGreeting() {
    const dateEl = document.getElementById('current-date');
    const greetingEl = document.getElementById('greeting-time');
    
    if (!dateEl) return;

    const now = new Date();
    
    // 1. Format and update the date (e.g., "THURSDAY, OCTOBER 8, 2026")
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', dateOptions).toUpperCase();
    
    // 2. Update the greeting based on the hour of the day
    if (greetingEl) {
        const hour = now.getHours();
        let greeting = 'Good evening';
        
        if (hour < 12) {
            greeting = 'Good morning';
        } else if (hour < 18) {
            greeting = 'Good afternoon';
        }
        
        greetingEl.textContent = `${greeting}, Alex.`;
    }
}

// --- Event Handlers ---

/**
 * Toggle the visibility of all balances
 */
function toggleBalances() {
    state.balancesVisible = !state.balancesVisible;
    
    if (eyeOpenIcon && eyeClosedIcon) {
        if (state.balancesVisible) {
            eyeOpenIcon.style.display = 'block';
            eyeClosedIcon.style.display = 'none';
        } else {
            eyeOpenIcon.style.display = 'none';
            eyeClosedIcon.style.display = 'block';
        }
    }
    
    updateBalancesUI();
}

/**
 * Open the restriction popup modal
 */
function openPopup() {
    if (popupModal) popupModal.style.display = 'flex';
}

/**
 * Close the restriction popup modal
 */
function closePopup() {
    if (popupModal) popupModal.style.display = 'none';
}

/**
 * Toggle the mobile sidebar menu
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

// --- Authentication Check ---
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    if (isLoggedIn !== 'true') {
        window.location.href = 'login.html';
    } else {
        const appContainer = document.getElementById('app-container');
        if (appContainer) appContainer.style.display = 'flex';
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Authentication FIRST
    checkAuth();
    
    // If the user is not authenticated, stop execution here
    if (sessionStorage.getItem('isLoggedIn') !== 'true') return;

    // 2. Select all DOM elements
    totalDepositsEl = document.getElementById('total-deposits');
    checkingBalanceEl = document.getElementById('checking-balance');
    savingsBalanceEl = document.getElementById('savings-balance');
    creditBalanceEl = document.getElementById('credit-balance');
    eyeOpenIcon = document.getElementById('eye-open');
    eyeClosedIcon = document.getElementById('eye-closed');
    popupModal = document.getElementById('popup-modal');

    // 3. Initialize UI
    updateBalancesUI();
    updateDynamicGreeting(); // <--- NEW: Updates the date and greeting dynamically
    
    // 4. Set up event listeners
    if (popupModal) {
        popupModal.addEventListener('click', (e) => {
            if (e.target === popupModal) closePopup();
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && popupModal && popupModal.style.display === 'flex') {
            closePopup();
        }
    });

    console.log('--- Alder Banking Dashboard Initialized ---');
});

// --- Expose functions to global scope for inline HTML onclick attributes ---
window.toggleBalances = toggleBalances;
window.openPopup = openPopup;
window.closePopup = closePopup;
window.toggleSidebar = toggleSidebar;


// =========================================
// WebAuthn Passkey Authentication (USB / Biometric)
// =========================================

/**
 * Trigger the browser's native WebAuthn prompt.
 * This will ask the user for their USB security key, fingerprint, or Face ID.
 * NOTE: Requires HTTPS or localhost. Will NOT work via file://
 */
async function authenticateWithPasskey() {
  // 1. Check if the browser supports WebAuthn
  if (!window.PublicKeyCredential) {
    alert('Your browser does not support security keys. Please use a modern browser like Chrome, Edge, or Safari.');
    return;
  }

  try {
    // 2. Generate a random challenge
    // (In a real app, this challenge comes from your server to prevent replay attacks)
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    // 3. Trigger the browser's native security prompt
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: challenge,
        rp: {
          name: "Alder Banking",
          id: window.location.hostname
        },
        user: {
          id: new Uint8Array(16),
          name: "alex@alder.com",
          displayName: "Alex Morgan"
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },   // ES256
          { type: "public-key", alg: -257 }  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "cross-platform", // "cross-platform" = USB key, "platform" = fingerprint
          userVerification: "required"               // Requires PIN or biometric
        },
        timeout: 60000,
        attestation: "none"
      }
    });

    // 4. Success! Log the user in
    console.log("Passkey verified successfully:", credential);
    alert("Security key verified! Logging you in...");
    
    // In production, you'd send `credential` to your server for verification.
    // For this demo, we just log them in.
    sessionStorage.setItem('isLoggedIn', 'true');
    window.location.href = 'index.html';

  } catch (error) {
    // 5. Handle errors gracefully
    console.error("Passkey authentication failed:", error);
    
    if (error.name === 'NotAllowedError') {
      alert('Security key prompt was cancelled or timed out. Please try again.');
    } else if (error.name === 'NotSupportedError') {
      alert('No compatible security key was found. Please make sure your USB key is inserted.');
    } else if (error.name === 'SecurityError') {
      alert('Security key requires HTTPS. Please access this site via a secure connection.');
    } else {
      alert('Authentication error: ' + error.message);
    }
  }
}

// --- Expose functions to global scope for HTML onclick attributes ---
window.openSidePanel = openSidePanel;
window.closeSidePanel = closeSidePanel;
window.togglePassword = togglePassword;
window.authenticateWithPasskey = authenticateWithPasskey; // <-- NEW