import { registerUser, loginUser } from "./api.js";
import { saveAuth, getAuth, setStatus } from "./common.js";

const els = {
  status: document.getElementById("statusMessage"),
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

els.registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const payload = {
      firstName: els.registerFirstName.value.trim(),
      lastName: els.registerLastName.value.trim(),
      email: els.registerEmail.value.trim(),
      password: els.registerPassword.value
    };

    await registerUser(payload);

    setStatus(els.status, "Registration successful. Please log in.");
    els.registerForm.reset();
  } catch (error) {
    setStatus(els.status, error.message || "Registration failed.", true);
  }
});

els.loginForm.addEventListener("submit", async (e) => {
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

    setStatus(els.status, "Login successful.");
    window.location.href = "./dashboard.html";
  } catch (error) {
    setStatus(els.status, error.message || "Login failed.", true);
  }
});