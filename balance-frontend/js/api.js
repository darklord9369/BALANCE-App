import { DEFAULT_API_BASE_URL } from "./config.js";

let apiBaseUrl = DEFAULT_API_BASE_URL;

export function setApiBaseUrl(url) {
  apiBaseUrl = (url || DEFAULT_API_BASE_URL).replace(/\/$/, "");
}

function buildUrl(path) {
  return `${apiBaseUrl}${path}`;
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

// Users
export const getUserById = (id) => request(`/api/Users/${id}`);

export const updateUserProfile = (id, payload) =>
  request(`/api/Users/${id}/profile`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

// Events
export const getEvents = (userId) =>
  request(userId ? `/api/Events?userId=${userId}` : "/api/Events");

export const getEventById = (id) => request(`/api/Events/${id}`);

export const createEvent = (payload) =>
  request("/api/Events", {
    method: "POST",
    body: JSON.stringify(payload)
  });

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
export const getWorkoutLogs = (userId) =>
  request(userId ? `/api/WorkoutLogs?userId=${userId}` : "/api/WorkoutLogs");

export const getWorkoutLogById = (id) => request(`/api/WorkoutLogs/${id}`);

export const createWorkoutLog = (payload) =>
  request("/api/WorkoutLogs", {
    method: "POST",
    body: JSON.stringify(payload)
  });

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
export const getMealLogs = (userId) =>
  request(userId ? `/api/MealLogs?userId=${userId}` : "/api/MealLogs");

export const getMealLogById = (id) => request(`/api/MealLogs/${id}`);

export const createMealLog = (payload) =>
  request("/api/MealLogs", {
    method: "POST",
    body: JSON.stringify(payload)
  });

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
export const getWellnessLogs = (userId) =>
  request(userId ? `/api/WellnessLogs?userId=${userId}` : "/api/WellnessLogs");

export const getWellnessLogById = (id) => request(`/api/WellnessLogs/${id}`);

export const createWellnessLog = (payload) =>
  request("/api/WellnessLogs", {
    method: "POST",
    body: JSON.stringify(payload)
  });

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
export const getWeeklySummaries = (userId) =>
  request(`/api/WeeklySummaries?userId=${userId}`);

export const generateWeeklySummary = (userId, weekStartDate) =>
  request(
    `/api/WeeklySummaries/generate?userId=${userId}&weekStartDate=${weekStartDate}`,
    {
      method: "POST"
    }
  );

// Lookup tables
export const getEventTypes = () => request("/api/EventTypes");
export const getWorkoutTypes = () => request("/api/WorkoutTypes");
export const getMealCategories = () => request("/api/MealCategories");