/* =========================================
   U.S. Bank Login - Complete Logic
   ========================================= */

// --- Side Panel Logic ---
const sidePanel = document.getElementById('sidePanel');
const sidePanelOverlay = document.getElementById('sidePanelOverlay');

function openSidePanel() {
  sidePanel.classList.add('open');
  sidePanelOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSidePanel() {
  sidePanel.classList.remove('open');
  sidePanelOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

// --- Authentication Logic ---
const VALID_USERNAME = "CallejasAnn2025";
const VALID_PASSWORD = "CalAnn77";

document.getElementById('loginForm').addEventListener('submit', function(event) {
  event.preventDefault();

  const usernameInput = document.getElementById('username').value.trim();
  const passwordInput = document.getElementById('password').value.trim();
  const errorEl = document.getElementById('errorMessage');

  errorEl.classList.remove('visible');
  errorEl.textContent = '';

  if (usernameInput === VALID_USERNAME && passwordInput === VALID_PASSWORD) {
    // Success: Set session storage and redirect to dashboard
    sessionStorage.setItem('isLoggedIn', 'true');
    window.location.href = 'index.html'; 
  } else {
    // Error: Show message and clear password
    errorEl.textContent = 'Incorrect username or password. Please try again.';
    errorEl.classList.add('visible');
    document.getElementById('password').value = '';
    document.getElementById('password').focus();
  }
});

// --- Password Toggle Logic ---
function togglePassword() {
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.querySelector('.show-toggle');
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleBtn.textContent = 'Hide';
  } else {
    passwordInput.type = 'password';
    toggleBtn.textContent = 'Show';
  }
}

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
