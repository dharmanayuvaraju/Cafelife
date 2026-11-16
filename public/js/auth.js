// CafeLive - Authentication Module (js/auth.js)
// Handles Email/Password Sign Up, Sign In, Google Sign In, and Sign Out using Firebase v10 modular SDK

import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  escapeHtml
} from "./firebase.js?v=20261113b";

// Helper to convert Firebase error codes to friendly English messages
export function getFriendlyAuthErrorMessage(errorCode) {
  switch (errorCode) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/popup-closed-by-user":
      return "Google sign-in popup was closed before completing.";
    case "auth/popup-blocked":
      return "Google sign-in popup was blocked by your browser. Please allow popups.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    default:
      return "Authentication error: " + (errorCode || "Something went wrong.");
  }
}

// 1. Sign In with Email & Password
export async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: getFriendlyAuthErrorMessage(error.code) };
  }
}

// 2. Sign Up with Email & Password (with optional Display Name)
export async function registerWithEmail(email, password, displayName = "") {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const trimmedName = displayName ? displayName.trim() : "";
    if (trimmedName && userCredential.user) {
      try {
        await updateProfile(userCredential.user, { displayName: trimmedName });
      } catch (profileError) {
        console.warn("Could not set display name on auth profile:", profileError);
      }
    }
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: getFriendlyAuthErrorMessage(error.code) };
  }
}

// 3. Sign In with Google Popup
export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: getFriendlyAuthErrorMessage(error.code) };
  }
}

// 4. Sign Out
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 5. Watch Auth State Changes
export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

// 6. Universal Header Auth Pill Renderer
// Keeps the navigation bar user email and logout button synced on any page
export function setupHeaderAuthPill(containerId = "authPill") {
  const container = document.getElementById(containerId);
  if (!container) return;

  subscribeToAuthState((user) => {
    if (user) {
      const emailDisplay = escapeHtml(user.email || "Customer");
      container.innerHTML = `
        <span class="user-email" title="${emailDisplay}">👤 ${emailDisplay}</span>
        <button id="headerLogoutBtn" class="btn btn-outline btn-sm" type="button">Logout</button>
      `;
      const logoutBtn = document.getElementById("headerLogoutBtn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
          logoutBtn.disabled = true;
          logoutBtn.textContent = "Logging out...";
          await logoutUser();
        });
      }
    } else {
      container.innerHTML = `
        <a href="index.html#authSection" id="headerSignInBtn" class="btn btn-primary btn-sm" style="padding: 0.35rem 0.85rem; font-weight: 700; text-decoration: none;">Sign In / Join</a>
      `;
      const signInBtn = document.getElementById("headerSignInBtn");
      if (signInBtn) {
        signInBtn.addEventListener("click", (e) => {
          const authCard = document.getElementById("authSection");
          if (authCard) {
            e.preventDefault();
            authCard.scrollIntoView({ behavior: "smooth" });
            authCard.style.outline = "3px solid var(--color-saffron)";
            setTimeout(() => { authCard.style.outline = "none"; }, 1500);
            const emailInput = document.getElementById("authEmail");
            if (emailInput) setTimeout(() => emailInput.focus(), 250);
          }
        });
      }
    }
  });
}

