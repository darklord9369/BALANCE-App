# BALANCE Simple UI

This is a simple multi-page frontend based on your hand-drawn wireframe.

## Pages
- `index.html` -> onboarding and event setup
- `dashboard.html` -> main dashboard
- `workout.html` -> log workout
- `meal.html` -> log meal
- `insights.html` -> weekly insight screen

## Run locally
From this folder:
```bash
python -m http.server 5500
```

Then open:
```text
http://localhost:5500
```

## Backend URL
Use your ASP.NET Core backend URL, for example:
```text
http://localhost:5000
```

## API routes used
- `GET /api/Users/{id}`
- `GET /api/Events`
- `POST /api/Events`
- `GET /api/WorkoutLogs`
- `POST /api/WorkoutLogs`
- `GET /api/MealLogs`
- `POST /api/MealLogs`
- `GET /api/WellnessLogs`
- `GET /api/WeeklySummaries`
- `POST /api/WeeklySummaries/generate`

## Important
This version uses the exact payload fields you shared.
User ID and API base URL are stored in localStorage.
