import { DEFAULT_API_BASE_URL } from "./config.js";
import { getAuth, loadAppState } from "./common.js";

function getApiBaseUrl() {
  const auth = getAuth();
  const state = loadAppState();
  return (auth.apiBaseUrl || state.apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

export function setApiBaseUrl(url) {
  const normalized = (url || DEFAULT_API_BASE_URL).replace(/\/$/, "");
  localStorage.setItem("balance_apiBaseUrl", normalized);
}

function buildUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}

function getAuthHeaders(extraHeaders = {}) {
  const auth = getAuth();
  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders
  };

  if (auth.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }

  return headers;
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    headers: getAuthHeaders(options.headers || {}),
    ...options
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function getCurrentUserId(fallbackUserId) {
  const auth = getAuth();
  return fallbackUserId || auth.userId || "";
}

// Auth
export const registerUser = (payload) =>
  request("/api/Auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const loginUser = (payload) =>
  request("/api/Auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });

// Users
export const getUserById = (id) => request(`/api/Users/${id}`);

export const getCurrentUser = () => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("No logged-in user found.");
  return getUserById(userId);
};

export const updateUserProfile = (id, payload) =>
  request(`/api/Users/${id}/profile`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

export const updateCurrentUserProfile = (payload) => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error("No logged-in user found.");
  return updateUserProfile(userId, payload);
};

// Events
export const getEvents = (userId) => {
  const resolvedUserId = getCurrentUserId(userId);
  return request(resolvedUserId ? `/api/Events?userId=${resolvedUserId}` : "/api/Events");
};

export const getEventById = (id) => request(`/api/Events/${id}`);

export const createEvent = (payload) => {
  const resolvedUserId = getCurrentUserId(payload?.userId);
  return request("/api/Events", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      userId: resolvedUserId
    })
  });
};

export const updateEvent = (id, payload) =>
  request(`/api/Events/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

export const deleteEvent = (id) =>
  request(`/api/Events/${id}`, {
    method: "DELETE"
  });

// Workout Logs
export const getWorkoutLogs = (userId) => {
  const resolvedUserId = getCurrentUserId(userId);
  return request(resolvedUserId ? `/api/WorkoutLogs?userId=${resolvedUserId}` : "/api/WorkoutLogs");
};

export const getWorkoutLogById = (id) => request(`/api/WorkoutLogs/${id}`);

export const createWorkoutLog = (payload) => {
  const resolvedUserId = getCurrentUserId(payload?.userId);
  return request("/api/WorkoutLogs", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      userId: resolvedUserId
    })
  });
};

export const updateWorkoutLog = (id, payload) =>
  request(`/api/WorkoutLogs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

export const deleteWorkoutLog = (id) =>
  request(`/api/WorkoutLogs/${id}`, {
    method: "DELETE"
  });

// Meal Logs
export const getMealLogs = (userId) => {
  const resolvedUserId = getCurrentUserId(userId);
  return request(resolvedUserId ? `/api/MealLogs?userId=${resolvedUserId}` : "/api/MealLogs");
};

export const getMealLogById = (id) => request(`/api/MealLogs/${id}`);

export const createMealLog = (payload) => {
  const resolvedUserId = getCurrentUserId(payload?.userId);
  return request("/api/MealLogs", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      userId: resolvedUserId
    })
  });
};

export const updateMealLog = (id, payload) =>
  request(`/api/MealLogs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

export const deleteMealLog = (id) =>
  request(`/api/MealLogs/${id}`, {
    method: "DELETE"
  });

// Wellness Logs
export const getWellnessLogs = (userId) => {
  const resolvedUserId = getCurrentUserId(userId);
  return request(resolvedUserId ? `/api/WellnessLogs?userId=${resolvedUserId}` : "/api/WellnessLogs");
};

export const getWellnessLogById = (id) => request(`/api/WellnessLogs/${id}`);

export const createWellnessLog = (payload) => {
  const resolvedUserId = getCurrentUserId(payload?.userId);
  return request("/api/WellnessLogs", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      userId: resolvedUserId
    })
  });
};

export const updateWellnessLog = (id, payload) =>
  request(`/api/WellnessLogs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

export const deleteWellnessLog = (id) =>
  request(`/api/WellnessLogs/${id}`, {
    method: "DELETE"
  });

// Weekly Summaries
export const getWeeklySummaries = (userId) => {
  const resolvedUserId = getCurrentUserId(userId);
  if (!resolvedUserId) throw new Error("No logged-in user found.");
  return request(`/api/WeeklySummaries?userId=${resolvedUserId}`);
};

export const generateWeeklySummary = (userId, weekStartDate) => {
  const resolvedUserId = getCurrentUserId(userId);
  if (!resolvedUserId) throw new Error("No logged-in user found.");
  return request(
    `/api/WeeklySummaries/generate?userId=${resolvedUserId}&weekStartDate=${weekStartDate}`,
    {
      method: "POST"
    }
  );
};

// Daily Guidance
export const generateDailyGuidance = (selectedDate) => {
  if (!selectedDate) throw new Error("Selected date is required.");
  return request(
    `/api/DailyGuidance/generate?selectedDate=${encodeURIComponent(selectedDate)}`,
    { method: "POST" }
  );
};

// Lookup tables
export const getEventTypes = () => request("/api/EventTypes");
export const getWorkoutTypes = () => request("/api/WorkoutTypes");
export const getMealCategories = () => request("/api/MealCategories");