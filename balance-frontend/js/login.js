import { registerUser, loginUser } from "./api.js";
import { saveAuth, getAuth, setStatus } from "./common.js";

const els = {
  status: document.getElementById("statusMessage"),

  authPageSubtitle: document.getElementById("authPageSubtitle"),
  loginCard: document.getElementById("loginCard"),
  registerCard: document.getElementById("registerCard"),
  showRegisterBtn: document.getElementById("showRegisterBtn"),
  showLoginBtn: document.getElementById("showLoginBtn"),

  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),

  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),

  registerFirstName: document.getElementById("registerFirstName"),
  registerLastName: document.getElementById("registerLastName"),
  registerEmail: document.getElementById("registerEmail"),
  registerPassword: document.getElementById("registerPassword")
};

const existingAuth = getAuth();
if (existingAuth?.isLoggedIn) {
  window.location.href = "./dashboard.html";
}

function showStatus(message, isError = false) {
  if (!els.status) return;

  els.status.style.display = "block";
  setStatus(els.status, message, isError);
}

function clearStatus() {
  if (!els.status) return;

  els.status.textContent = "";
  els.status.style.display = "none";
}

function showLoginCard() {
  els.loginCard?.classList.remove("hidden");
  els.registerCard?.classList.add("hidden");

  if (els.authPageSubtitle) {
    els.authPageSubtitle.textContent = "Log in to continue.";
  }

  clearStatus();
}

function showRegisterCard() {
  els.loginCard?.classList.add("hidden");
  els.registerCard?.classList.remove("hidden");

  if (els.authPageSubtitle) {
    els.authPageSubtitle.textContent = "Create a new account to get started.";
  }

  clearStatus();
}

els.showRegisterBtn?.addEventListener("click", showRegisterCard);
els.showLoginBtn?.addEventListener("click", showLoginCard);

els.registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const payload = {
      firstName: els.registerFirstName.value.trim(),
      lastName: els.registerLastName.value.trim(),
      email: els.registerEmail.value.trim(),
      password: els.registerPassword.value
    };

    await registerUser(payload);

    showStatus("Registration successful. Please log in.");
    els.registerForm.reset();

    showLoginCard();
    showStatus("Registration successful. Please log in.");
  } catch (error) {
    showStatus(error.message || "Registration failed.", true);
  }
});

els.loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const payload = {
      email: els.loginEmail.value.trim(),
      password: els.loginPassword.value
    };

    const data = await loginUser(payload);

    saveAuth({
      apiBaseUrl: "http://localhost:5000",
      token: data.token,
      user: data.user
    });

    showStatus("Login successful.");
    window.location.href = "./dashboard.html";
  } catch (error) {
    showStatus(error.message || "Login failed.", true);
  }
});

showLoginCard();