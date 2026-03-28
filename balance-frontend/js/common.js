import { DEFAULT_API_BASE_URL } from "./config.js";

const STORAGE_KEYS = {
  apiBaseUrl: "balance_apiBaseUrl",
  token: "balance_token",
  userId: "balance_userId",
  userName: "balance_userName",
  userEmail: "balance_userEmail"
};

export function saveAppState({
  apiBaseUrl,
  userId,
  token = "",
  userName = "",
  userEmail = ""
}) {
  localStorage.setItem(STORAGE_KEYS.apiBaseUrl, apiBaseUrl || DEFAULT_API_BASE_URL);
  localStorage.setItem(STORAGE_KEYS.userId, String(userId || ""));
  localStorage.setItem(STORAGE_KEYS.token, token || "");
  localStorage.setItem(STORAGE_KEYS.userName, userName || "");
  localStorage.setItem(STORAGE_KEYS.userEmail, userEmail || "");
}

export function loadAppState() {
  return {
    apiBaseUrl: localStorage.getItem(STORAGE_KEYS.apiBaseUrl) || DEFAULT_API_BASE_URL,
    userId: localStorage.getItem(STORAGE_KEYS.userId) || "",
    token: localStorage.getItem(STORAGE_KEYS.token) || "",
    userName: localStorage.getItem(STORAGE_KEYS.userName) || "",
    userEmail: localStorage.getItem(STORAGE_KEYS.userEmail) || ""
  };
}

export function saveAuth({ apiBaseUrl, token, user }) {
  saveAppState({
    apiBaseUrl: apiBaseUrl || DEFAULT_API_BASE_URL,
    token: token || "",
    userId: user?.userId || "",
    userName: user?.firstName || "",
    userEmail: user?.email || ""
  });
}

export function getAuth() {
  const state = loadAppState();
  return {
    apiBaseUrl: state.apiBaseUrl,
    token: state.token,
    userId: state.userId,
    userName: state.userName,
    userEmail: state.userEmail,
    isLoggedIn: Boolean(state.token && state.userId)
  };
}

export function isLoggedIn() {
  const auth = getAuth();
  return auth.isLoggedIn;
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEYS.apiBaseUrl);
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.userId);
  localStorage.removeItem(STORAGE_KEYS.userName);
  localStorage.removeItem(STORAGE_KEYS.userEmail);
}

export function logout() {
  clearAuth();
  window.location.href = "login.html";
}

export function requireAuth(redirectTo = "login.html") {
  const auth = getAuth();
  if (!auth.isLoggedIn) {
    window.location.href = redirectTo;
    return null;
  }
  return auth;
}

export function redirectIfLoggedIn(targetPage = "dashboard.html") {
  const auth = getAuth();
  if (auth.isLoggedIn) {
    window.location.href = targetPage;
    return true;
  }
  return false;
}

export function todayIso() {
  return new Date().toISOString().split("T")[0];
}

export function setStatus(el, message, isError = false) {
  if (!el) return;
  el.textContent = message;
  el.style.color = isError ? "#b91c1c" : "#64748b";
}

export function filterByUser(items, userId) {
  return (items || []).filter(x => String(x.userId) === String(userId));
}

export function stressClass(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("low")) return "badge-low";
  if (text.includes("medium") || text.includes("moderate")) return "badge-medium";
  return "badge-high";
}