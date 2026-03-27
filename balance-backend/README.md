# Fitness Planner Backend

A runnable ASP.NET Core 8 Web API starter backend for the Adaptive Nutrition & Workout Planner project.

## Stack
- ASP.NET Core 8 Web API
- Entity Framework Core
- PostgreSQL
- JWT authentication
- Swagger/OpenAPI

## What is included
- User registration and login
- User profile endpoint
- CRUD for events
- CRUD for workout logs
- CRUD for meal logs
- CRUD for wellness logs
- Weekly summary generation
- Seeded lookup data for event types, workout types, meal categories, and recommendation types
- Soft deletion via `DeletedAt`
- Automatic `CreatedAt` and `UpdatedAt` timestamps

## Repository structure
```text
fitness-backend/
├── docker-compose.yml
├── README.md
└── FitnessPlanner.Api/
    ├── Controllers/
    ├── Data/
    ├── DTOs/
    ├── Models/
    ├── appsettings.json
    ├── appsettings.Development.json
    ├── FitnessPlanner.Api.csproj
    └── Program.cs
```

## Prerequisites
- .NET 8 SDK
- Docker Desktop or a local PostgreSQL installation

## Option A: Start PostgreSQL with Docker
From the `fitness-backend` folder:

```bash
docker compose up -d
```

This starts PostgreSQL on:
- Host: `localhost`
- Port: `5432`
- Database: `fitness_planner_db`
- Username: `postgres`
- Password: `postgres`

## Option B: Use your own PostgreSQL instance
Update `FitnessPlanner.Api/appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=fitness_planner_db;Username=postgres;Password=postgres"
}
```

## Run the API
From the `FitnessPlanner.Api` folder:

```bash
dotnet restore
dotnet run
```

The app uses `Database.EnsureCreated()` on startup, so the tables are created automatically the first time it connects to PostgreSQL.

## Swagger
When the API starts in development mode, Swagger is available at:

```text
https://localhost:xxxx/swagger
```

or sometimes:

```text
http://localhost:xxxx/swagger
```

The exact port depends on your local launch profile.

## Seeded reference data
The app automatically inserts:
- Event types: Exam Week, Project Deadline, Race, Heavy Training Week
- Workout types: Strength, Run, Walk, Cycling, Yoga, Recovery Session
- Meal categories: Carb-heavy, Balanced, Light, Protein-focused, Recovery meal

## Main endpoints
### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Users
- `GET /api/users/{id}`
- `PUT /api/users/{id}/profile`

### Reference data
- `GET /api/eventtypes`
- `GET /api/workouttypes`
- `GET /api/mealcategories`

### Events
- `GET /api/events?userId=1`
- `GET /api/events/{id}`
- `POST /api/events`
- `PUT /api/events/{id}`
- `DELETE /api/events/{id}`

### Workout logs
- `GET /api/workoutlogs?userId=1`
- `GET /api/workoutlogs/{id}`
- `POST /api/workoutlogs`
- `PUT /api/workoutlogs/{id}`
- `DELETE /api/workoutlogs/{id}`

### Meal logs
- `GET /api/meallogs?userId=1`
- `GET /api/meallogs/{id}`
- `POST /api/meallogs`
- `PUT /api/meallogs/{id}`
- `DELETE /api/meallogs/{id}`

### Wellness logs
- `GET /api/wellnesslogs?userId=1`
- `GET /api/wellnesslogs/{id}`
- `POST /api/wellnesslogs`
- `PUT /api/wellnesslogs/{id}`
- `DELETE /api/wellnesslogs/{id}`

### Weekly summaries
- `POST /api/weeklysummaries/generate?userId=1&weekStartDate=2026-03-16`
- `GET /api/weeklysummaries?userId=1`

## Example request payloads
### Register
```json
{
  "email": "student@example.com",
  "password": "Password123!",
  "firstName": "Alex",
  "lastName": "Taylor"
}
```

### Create event
```json
{
  "userId": 1,
  "eventTypeId": 1,
  "title": "Midterm Week",
  "description": "Three midterms this week",
  "startDate": "2026-03-23",
  "endDate": "2026-03-27",
  "stressLevel": "high"
}
```

### Create workout log
```json
{
  "userId": 1,
  "workoutTypeId": 2,
  "eventId": 1,
  "workoutDate": "2026-03-20",
  "durationMinutes": 35,
  "perceivedIntensity": "moderate",
  "effortScore": 6,
  "source": "manual",
  "notes": "Easy run between study sessions",
  "status": "completed"
}
```

### Create meal log
```json
{
  "userId": 1,
  "mealCategoryId": 2,
  "eventId": 1,
  "mealDate": "2026-03-20",
  "mealTime": "dinner",
  "notes": "Rice bowl with chicken and vegetables",
  "source": "manual",
  "status": "logged"
}
```

### Create wellness log
```json
{
  "userId": 1,
  "logDate": "2026-03-20",
  "energyLevel": 6,
  "stressLevel": 8,
  "recoveryLevel": 5,
  "sleepHours": 6.5,
  "mood": "stressed",
  "notes": "Busy day preparing for exams"
}
```

## Development notes
- The current version is intentionally basic and does not include AI recommendations.
- Authentication is wired for JWT generation, but the endpoints are not yet protected with `[Authorize]`.
- The API currently accepts `userId` in requests to keep Phase 1 development simple.
- A good Phase 2 step is to read the user ID from JWT claims instead of from request payloads.

## Suggested next improvements
- Protect endpoints with JWT auth
- Add a service layer
- Add pagination and filtering
- Add unit and integration tests
- Add database migrations instead of `EnsureCreated()`
- Add frontend integration
