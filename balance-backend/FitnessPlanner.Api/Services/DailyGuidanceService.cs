using System.Text.Json;
using FitnessPlanner.Api.Data;
using FitnessPlanner.Api.DTOs.DailyGuidance;
using FitnessPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessPlanner.Api.Services;

public class DailyGuidanceService : IDailyGuidanceService
{
    private readonly AppDbContext _db;
    private readonly IDailyGuidanceAiService _dailyGuidanceAiService;
    private readonly IConfiguration _config;

    public DailyGuidanceService(
        AppDbContext db,
        IDailyGuidanceAiService dailyGuidanceAiService,
        IConfiguration config)
    {
        _db = db;
        _dailyGuidanceAiService = dailyGuidanceAiService;
        _config = config;
    }

    public async Task<DailyGuidanceResponseDto> GenerateOrRefreshAsync(long userId, DateOnly selectedDate)
    {
        var guidance = await _db.DailyGuidances
            .FirstOrDefaultAsync(x =>
                x.UserId == userId &&
                x.GuidanceDate == selectedDate &&
                x.DeletedAt == null);

        var user = await _db.Users
            .Include(x => x.Profile)
            .FirstOrDefaultAsync(x => x.UserId == userId && x.DeletedAt == null);

        var currentMealPreferenceSignature = BuildMealPreferenceSignature(user);
        var storedMealPreferenceSignature = guidance == null
            ? ""
            : ExtractStoredMealPreferenceSignature(guidance.SummaryText);

        var mealPreferencesChanged =
            guidance != null &&
            !string.Equals(
                currentMealPreferenceSignature,
                storedMealPreferenceSignature,
                StringComparison.Ordinal);

        if (mealPreferencesChanged && guidance != null)
        {
            guidance.InitialMealPlanJson = "[]";
            guidance.CurrentMealPlanJson = "[]";
            guidance.CompletedMealsJson = "[]";
        }

        var context = await BuildContextAsync(userId, selectedDate, guidance, mealPreferencesChanged);
        var aiResult = await _dailyGuidanceAiService.GenerateAsync(context);

        aiResult.Workout.Completed = BuildCompletedWorkoutItems(context.TodayCompletedWorkouts);
        aiResult.Meals.Completed = BuildCompletedMealItems(context.TodayCompletedMeals);

        if (guidance == null)
        {
            guidance = new DailyGuidance
            {
                UserId = userId,
                GuidanceDate = selectedDate,
                CreatedAt = DateTime.UtcNow
            };
            _db.DailyGuidances.Add(guidance);
        }

        var existingInitialWorkoutPlan = DeserializeStringList(guidance.InitialWorkoutPlanJson);
        var existingInitialMealPlan = DeserializeStringList(guidance.InitialMealPlanJson);

        var finalInitialWorkoutPlan = existingInitialWorkoutPlan.Any()
            ? existingInitialWorkoutPlan
            : aiResult.Workout.InitialPlan;

        var finalInitialMealPlan = existingInitialMealPlan.Any()
            ? existingInitialMealPlan
            : aiResult.Meals.InitialPlan;

        guidance.InitialWorkoutPlanJson = Serialize(finalInitialWorkoutPlan);
        guidance.CurrentWorkoutPlanJson = Serialize(aiResult.Workout.CurrentPlan);

        guidance.InitialMealPlanJson = Serialize(finalInitialMealPlan);
        guidance.CurrentMealPlanJson = Serialize(aiResult.Meals.CurrentPlan);

        guidance.CompletedWorkoutsJson = Serialize(aiResult.Workout.Completed);
        guidance.CompletedMealsJson = Serialize(aiResult.Meals.Completed);

        guidance.SummaryText = AttachMealPreferenceSignature(
            aiResult.Summary ?? "",
            currentMealPreferenceSignature
        );

        guidance.ModelVersion = _config["GenAI:Model"] ?? "llama3.1:latest";
        guidance.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return new DailyGuidanceResponseDto
        {
            SelectedDate = selectedDate.ToString("yyyy-MM-dd"),
            Workout = new PlanSectionDto
            {
                InitialPlan = finalInitialWorkoutPlan,
                CurrentPlan = aiResult.Workout.CurrentPlan,
                Completed = aiResult.Workout.Completed
            },
            Meals = new PlanSectionDto
            {
                InitialPlan = finalInitialMealPlan,
                CurrentPlan = aiResult.Meals.CurrentPlan,
                Completed = aiResult.Meals.Completed
            },
            Summary = RemoveStoredMealPreferenceSignature(guidance.SummaryText)
        };
    }

    private async Task<DailyGuidanceContextDto> BuildContextAsync(
        long userId,
        DateOnly selectedDate,
        DailyGuidance? existingGuidance,
        bool ignorePriorMealPlans)
    {
        var recentStartDate = selectedDate.AddDays(-7);
        var recentEndDate = selectedDate;
        var eventWindowStart = selectedDate.AddDays(-1);
        var eventWindowEnd = selectedDate.AddDays(1);

        var user = await _db.Users
            .Include(x => x.Profile)
            .FirstOrDefaultAsync(x => x.UserId == userId && x.DeletedAt == null);

        var workouts = await _db.WorkoutLogs
            .Include(x => x.WorkoutType)
            .Where(x =>
                x.UserId == userId &&
                x.DeletedAt == null &&
                x.WorkoutDate >= recentStartDate &&
                x.WorkoutDate <= recentEndDate)
            .OrderByDescending(x => x.WorkoutDate)
            .ToListAsync();

        var meals = await _db.MealLogs
            .Include(x => x.MealCategory)
            .Where(x =>
                x.UserId == userId &&
                x.DeletedAt == null &&
                x.MealDate >= recentStartDate &&
                x.MealDate <= recentEndDate)
            .OrderByDescending(x => x.MealDate)
            .ToListAsync();

        var events = await _db.Events
            .Include(x => x.EventType)
            .Where(x =>
                x.UserId == userId &&
                x.DeletedAt == null &&
                x.StartDate <= eventWindowEnd &&
                x.EndDate >= eventWindowStart)
            .OrderBy(x => x.StartDate)
            .ToListAsync();

        var wellnessLogs = await _db.WellnessLogs
            .Where(x =>
                x.UserId == userId &&
                x.DeletedAt == null &&
                x.LogDate >= recentStartDate &&
                x.LogDate <= selectedDate)
            .OrderByDescending(x => x.LogDate)
            .ToListAsync();

        var todayCompletedWorkouts = workouts
            .Where(x => x.WorkoutDate == selectedDate)
            .Select(BuildWorkoutCompletedTitle)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToList();

        var todayCompletedMeals = meals
            .Where(x => x.MealDate == selectedDate)
            .Select(BuildMealCompletedTitle)
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToList();

        var recentWorkoutSummaries = workouts
            .Select(x =>
                $"{x.WorkoutDate:yyyy-MM-dd}: {x.WorkoutType?.Name ?? "Workout"}, " +
                $"Duration={x.DurationMinutes} min, Intensity={x.PerceivedIntensity ?? "Unknown"}")
            .ToList();

        var recentMealSummaries = meals
            .Select(x =>
                $"{x.MealDate:yyyy-MM-dd}: {x.MealTime ?? "Meal"}, Category={x.MealCategory?.Name ?? "Unknown"}")
            .ToList();

        var eventSummaries = events
            .Select(x =>
                $"{x.Title} | Type={x.EventType?.Name ?? "Unknown"} | " +
                $"Dates={x.StartDate:yyyy-MM-dd} to {x.EndDate:yyyy-MM-dd} | " +
                $"Stress={x.StressLevel}")
            .ToList();

        var stressLevel = ResolveStressLevel(selectedDate, wellnessLogs, events);

        return new DailyGuidanceContextDto
        {
            SelectedDate = selectedDate.ToString("yyyy-MM-dd"),
            StressLevel = stressLevel,
            RecentWorkouts = recentWorkoutSummaries,
            RecentMeals = recentMealSummaries,
            UpcomingEvents = eventSummaries,
            TodayCompletedWorkouts = todayCompletedWorkouts,
            TodayCompletedMeals = todayCompletedMeals,
            PriorInitialWorkoutPlan = DeserializeStringList(existingGuidance?.InitialWorkoutPlanJson),
            PriorCurrentWorkoutPlan = DeserializeStringList(existingGuidance?.CurrentWorkoutPlanJson),
            PriorInitialMealPlan = ignorePriorMealPlans
                ? new List<string>()
                : DeserializeStringList(existingGuidance?.InitialMealPlanJson),
            PriorCurrentMealPlan = ignorePriorMealPlans
                ? new List<string>()
                : DeserializeStringList(existingGuidance?.CurrentMealPlanJson),

            Age = user?.Profile?.Age,
            DietType = user?.Profile?.DietType,
            IsVegan = user?.Profile?.IsVegan,
            IsGlutenFree = user?.Profile?.IsGlutenFree,
            Allergens = user?.Profile?.Allergens
        };
    }

    private static string ResolveStressLevel(
        DateOnly selectedDate,
        List<WellnessLog> wellnessLogs,
        List<Event> events)
    {
        var sameDayWellness = wellnessLogs.FirstOrDefault(x => x.LogDate == selectedDate);

        if (sameDayWellness?.StressLevel != null)
        {
            var stress = sameDayWellness.StressLevel;

            if (stress <= 3) return "Low";
            if (stress <= 6) return "Medium";
            return "High";
        }

        var activeEvents = events
            .Where(x => x.StartDate <= selectedDate && x.EndDate >= selectedDate)
            .ToList();

        if (!activeEvents.Any())
        {
            return "Low";
        }

        var hasHigh = activeEvents.Any(x =>
            string.Equals(x.StressLevel, "High", StringComparison.OrdinalIgnoreCase));

        if (hasHigh) return "High";

        var hasMedium = activeEvents.Any(x =>
            string.Equals(x.StressLevel, "Medium", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(x.StressLevel, "Moderate", StringComparison.OrdinalIgnoreCase));

        if (hasMedium) return "Medium";

        return "Low";
    }

    private static string BuildWorkoutCompletedTitle(WorkoutLog workout)
    {
        return workout.WorkoutType?.Name?.Trim() ?? "Workout";
    }

    private static string BuildMealCompletedTitle(MealLog meal)
    {
        var mealTime = string.IsNullOrWhiteSpace(meal.MealTime) ? "Meal" : meal.MealTime.Trim();
        var categoryName = meal.MealCategory?.Name?.Trim() ?? "Meal";
        return $"{mealTime}: {categoryName}";
    }

    private static List<CompletedItemDto> BuildCompletedWorkoutItems(IEnumerable<string> items)
    {
        return items
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => new CompletedItemDto
            {
                Title = x.Trim(),
                TimeLabel = "Logged today",
                Status = "completed"
            })
            .ToList();
    }

    private static List<CompletedItemDto> BuildCompletedMealItems(IEnumerable<string> items)
    {
        return items
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => new CompletedItemDto
            {
                Title = x.Trim(),
                TimeLabel = "Logged today",
                Status = "completed"
            })
            .ToList();
    }

    private static string BuildMealPreferenceSignature(User? user)
    {
        var dietType = user?.Profile?.DietType?.Trim().ToLowerInvariant() ?? "";
        var isVegan = user?.Profile?.IsVegan?.ToString().ToLowerInvariant() ?? "";
        var isGlutenFree = user?.Profile?.IsGlutenFree?.ToString().ToLowerInvariant() ?? "";
        var allergens = user?.Profile?.Allergens?.Trim().ToLowerInvariant() ?? "";

        return $"{dietType}|{isVegan}|{isGlutenFree}|{allergens}";
    }

    private static string ExtractStoredMealPreferenceSignature(string? summaryText)
    {
        if (string.IsNullOrWhiteSpace(summaryText))
        {
            return "";
        }

        const string marker = "[MEAL_PREF_SIGNATURE]:";
        var start = summaryText.IndexOf(marker, StringComparison.Ordinal);
        if (start < 0)
        {
            return "";
        }

        start += marker.Length;
        var end = summaryText.IndexOf('\n', start);
        if (end < 0)
        {
            end = summaryText.Length;
        }

        return summaryText[start..end].Trim();
    }

    private static string RemoveStoredMealPreferenceSignature(string? summaryText)
    {
        if (string.IsNullOrWhiteSpace(summaryText))
        {
            return "";
        }

        const string marker = "[MEAL_PREF_SIGNATURE]:";
        var start = summaryText.IndexOf(marker, StringComparison.Ordinal);
        if (start < 0)
        {
            return summaryText;
        }

        var end = summaryText.IndexOf('\n', start);
        if (end < 0)
        {
            return summaryText[..start].Trim();
        }

        var before = summaryText[..start];
        var after = summaryText[(end + 1)..];
        return $"{before}{after}".Trim();
    }

    private static string AttachMealPreferenceSignature(string? summaryText, string signature)
    {
        var cleanSummary = RemoveStoredMealPreferenceSignature(summaryText);
        return $"{cleanSummary}\n[MEAL_PREF_SIGNATURE]: {signature}".Trim();
    }

    private static string Serialize<T>(T value)
    {
        return JsonSerializer.Serialize(value);
    }

    private static List<string> DeserializeStringList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new List<string>();
        }

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }
}