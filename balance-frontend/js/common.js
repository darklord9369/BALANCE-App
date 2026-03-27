import { DEFAULT_API_BASE_URL } from "./config.js";

export function saveAppState({ apiBaseUrl, userId }) {
  localStorage.setItem("balance_apiBaseUrl", apiBaseUrl || DEFAULT_API_BASE_URL);
  localStorage.setItem("balance_userId", String(userId || ""));
}

export function loadAppState() {
  return {
    apiBaseUrl: localStorage.getItem("balance_apiBaseUrl") || DEFAULT_API_BASE_URL,
    userId: localStorage.getItem("balance_userId") || "1"
  };
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
