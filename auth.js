import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

const signinForm = document.querySelector("#signin-form");
const signupForm = document.querySelector("#signup-form");
const modeButtons = document.querySelectorAll("[data-mode]");
const statusMessage = document.querySelector("#auth-status");
const signedInPanel = document.querySelector("#signed-in-panel");
const authForms = document.querySelector("#auth-forms");
const userLabel = document.querySelector("#user-label");
const signoutButton = document.querySelector("#signout-button");

function showMessage(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
  statusMessage.hidden = !message;
}

function setBusy(form, busy) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = busy;
  button.textContent = busy ? "PLEASE WAIT…" : button.dataset.label;
}

function firebaseMessage(error) {
  const messages = {
    "auth/email-already-in-use": "That email already has an account. Try signing in.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Choose a stronger password with at least 8 characters.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/too-many-requests": "Too many attempts. Wait a little and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again."
  };
  return messages[error.code] || "Authentication failed. Please try again.";
}

function setMode(mode) {
  const isSignup = mode === "signup";
  signinForm.hidden = isSignup;
  signupForm.hidden = !isSignup;
  modeButtons.forEach((button) => {
    const selected = button.dataset.mode === mode;
    button.setAttribute("aria-selected", String(selected));
  });
  showMessage("");
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

signinForm.querySelector('button[type="submit"]').dataset.label = "SIGN IN";
signupForm.querySelector('button[type="submit"]').dataset.label = "CREATE ACCOUNT";

signinForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusy(signinForm, true);
  showMessage("");
  const formData = new FormData(signinForm);
  try {
    await signInWithEmailAndPassword(auth, formData.get("email").trim(), formData.get("password"));
    signinForm.reset();
  } catch (error) {
    showMessage(firebaseMessage(error), true);
  } finally {
    setBusy(signinForm, false);
  }
});

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusy(signupForm, true);
  showMessage("");
  const formData = new FormData(signupForm);
  const password = formData.get("password");
  if (password !== formData.get("confirm-password")) {
    showMessage("Passwords do not match.", true);
    setBusy(signupForm, false);
    return;
  }

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      formData.get("email").trim(),
      password
    );
    const displayName = formData.get("name").trim();
    if (displayName) await updateProfile(credential.user, { displayName });
    signupForm.reset();
  } catch (error) {
    showMessage(firebaseMessage(error), true);
  } finally {
    setBusy(signupForm, false);
  }
});

signoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
    showMessage("You have signed out.");
  } catch {
    showMessage("Could not sign out. Please try again.", true);
  }
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    authForms.hidden = true;
    signedInPanel.hidden = false;
    userLabel.textContent = user.displayName || user.email || "Signed-in user";
    showMessage("You are signed in.");
  } else {
    authForms.hidden = false;
    signedInPanel.hidden = true;
    userLabel.textContent = "";
  }
});
