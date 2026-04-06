using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using FitnessPlanner.Api.DTOs.DailyGuidance;

namespace FitnessPlanner.Api.Services;

public class DailyGuidanceAiService : IDailyGuidanceAiService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;

    public DailyGuidanceAiService(
        IHttpClientFactory httpClientFactory,
        IConfiguration config)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
    }

    public async Task<DailyGuidanceLlmResultDto> GenerateAsync(DailyGuidanceContextDto context)
    {
        var apiKey = _config["GenAI:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("GenAI API key is not configured on the server.");
        }

        var prompt = BuildDailyPrompt(context);
        var rawJson = await GenerateDailyGuidanceJsonAsync(apiKey, prompt);

        DailyGuidanceLlmResultDto? parsed;
        try
        {
            parsed = JsonSerializer.Deserialize<DailyGuidanceLlmResultDto>(
                rawJson,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                $"Failed to parse Daily Guidance JSON returned by GenAI. Raw content: {rawJson}",
                ex);
        }

        if (parsed == null)
        {
            throw new InvalidOperationException("Daily Guidance response was empty.");
        }

        NormalizeResult(parsed, context);
        return parsed;
    }

    private async Task<string> GenerateDailyGuidanceJsonAsync(string apiKey, string prompt)
    {
        var url = _config["GenAI:ChatUrl"] ?? "https://genai.rcac.purdue.edu/api/chat/completions";
        var model = _config["GenAI:Model"] ?? "llama3.1:latest";

        var requestBody = new
        {
            model,
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = """
You are an adaptive fitness and meal guidance assistant for a student wellness app.

Return JSON only. No markdown. No explanation. No headings.

Required JSON shape:
{
  "workout": {
    "initialPlan": ["..."],
    "currentPlan": ["..."],
    "completed": [
      { "title": "...", "timeLabel": "...", "status": "completed" }
    ]
  },
  "meals": {
    "initialPlan": ["..."],
    "currentPlan": ["..."],
    "completed": [
      { "title": "...", "timeLabel": "...", "status": "completed" }
    ]
  },
  "summary": "..."
}

Critical rules:
- NEVER invent completed workouts or completed meals.
- The completed arrays must exactly reflect the provided TODAY_COMPLETED_WORKOUTS and TODAY_COMPLETED_MEALS lists.
- If TODAY_COMPLETED_WORKOUTS is empty, workout.completed must be [].
- If TODAY_COMPLETED_MEALS is empty, meals.completed must be [].
- Do not add dates, durations, or labels that are not already provided.
- Keep suggestions supportive and practical.
- Avoid guilt-based language.
- Keep each item short.
- Use 2 to 4 items maximum for each plan list.
- Preserve the original direction of the plan if prior plans exist.
- If a workout is already completed today, adjust the remaining workout plan so it becomes lighter or complementary instead of drastically different.
- If meals are already completed today, keep only the remaining meal guidance for the rest of the day.
- If stress is high or events look demanding, prefer lighter workouts and simpler meal consistency guidance.
- Always return valid JSON only.
"""
                },
                new
                {
                    role = "user",
                    content = prompt
                }
            },
            stream = false
        };

        var json = JsonSerializer.Serialize(requestBody);
        var client = _httpClientFactory.CreateClient();

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(json, Encoding.UTF8, "application/json");

        using var response = await client.SendAsync(request);
        var raw = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"GenAI API error: {(int)response.StatusCode} - {raw}");
        }

        try
        {
            using var doc = JsonDocument.Parse(raw);

            if (doc.RootElement.TryGetProperty("choices", out var choices) &&
                choices.ValueKind == JsonValueKind.Array &&
                choices.GetArrayLength() > 0 &&
                choices[0].TryGetProperty("message", out var message) &&
                message.TryGetProperty("content", out var content))
            {
                return ExtractJsonObject(content.GetString() ?? "");
            }

            throw new Exception($"Unexpected GenAI response format: {raw}");
        }
        catch (JsonException)
        {
            throw new Exception($"Invalid JSON returned by GenAI API: {raw}");
        }
    }

    private static string BuildDailyPrompt(DailyGuidanceContextDto context)
    {
        var sb = new StringBuilder();

        sb.AppendLine("Create adaptive daily workout and meal guidance.");
        sb.AppendLine($"SelectedDate: {context.SelectedDate}");
        sb.AppendLine($"StressLevel: {context.StressLevel}");
        sb.AppendLine();

        sb.AppendLine("RECENT_WORKOUTS:");
        if (context.RecentWorkouts?.Any() == true)
        {
            foreach (var item in context.RecentWorkouts)
            {
                sb.AppendLine($"- {item}");
            }
        }
        else
        {
            sb.AppendLine("- No recent workouts logged.");
        }

        sb.AppendLine();
        sb.AppendLine("TODAY_COMPLETED_WORKOUTS:");
        if (context.TodayCompletedWorkouts?.Any() == true)
        {
            foreach (var item in context.TodayCompletedWorkouts)
            {
                sb.AppendLine($"- {item}");
            }
        }
        else
        {
            sb.AppendLine("- None");
        }

        sb.AppendLine();
        sb.AppendLine("RECENT_MEALS:");
        if (context.RecentMeals?.Any() == true)
        {
            foreach (var item in context.RecentMeals)
            {
                sb.AppendLine($"- {item}");
            }
        }
        else
        {
            sb.AppendLine("- No recent meals logged.");
        }

        sb.AppendLine();
        sb.AppendLine("TODAY_COMPLETED_MEALS:");
        if (context.TodayCompletedMeals?.Any() == true)
        {
            foreach (var item in context.TodayCompletedMeals)
            {
                sb.AppendLine($"- {item}");
            }
        }
        else
        {
            sb.AppendLine("- None");
        }

        sb.AppendLine();
        sb.AppendLine("ACTIVE_OR_UPCOMING_EVENTS:");
        if (context.UpcomingEvents?.Any() == true)
        {
            foreach (var item in context.UpcomingEvents)
            {
                sb.AppendLine($"- {item}");
            }
        }
        else
        {
            sb.AppendLine("- No major events logged.");
        }

        sb.AppendLine();
        sb.AppendLine("PRIOR_INITIAL_WORKOUT_PLAN:");
        if (context.PriorInitialWorkoutPlan?.Any() == true)
        {
            foreach (var item in context.PriorInitialWorkoutPlan)
            {
                sb.AppendLine($"- {item}");
            }
        }
        else
        {
            sb.AppendLine("- None");
        }

        sb.AppendLine();
        sb.AppendLine("PRIOR_CURRENT_WORKOUT_PLAN:");
        if (context.PriorCurrentWorkoutPlan?.Any() == true)
        {
            foreach (var item in context.PriorCurrentWorkoutPlan)
            {
                sb.AppendLine($"- {item}");
            }
        }
        else
        {
            sb.AppendLine("- None");
        }

        sb.AppendLine();
        sb.AppendLine("PRIOR_INITIAL_MEAL_PLAN:");
        if (context.PriorInitialMealPlan?.Any() == true)
        {
            foreach (var item in context.PriorInitialMealPlan)
            {
                sb.AppendLine($"- {item}");
            }
        }
        else
        {
            sb.AppendLine("- None");
        }

        sb.AppendLine();
        sb.AppendLine("PRIOR_CURRENT_MEAL_PLAN:");
        if (context.PriorCurrentMealPlan?.Any() == true)
        {
            foreach (var item in context.PriorCurrentMealPlan)
            {
                sb.AppendLine($"- {item}");
            }
        }
        else
        {
            sb.AppendLine("- None");
        }

        sb.AppendLine();
        sb.AppendLine("Important behavior rules:");
        sb.AppendLine("- Keep the daily guidance consistent with any prior plan.");
        sb.AppendLine("- Do not drastically change the plan unless clearly necessary.");
        sb.AppendLine("- If a heavier workout is already completed, suggest lighter movement for the rest of the day.");
        sb.AppendLine("- If no events are logged, the overall day is likely lower stress.");
        sb.AppendLine("- Prefer simple, balanced meal guidance.");
        sb.AppendLine("- Completed arrays must reflect completed items only.");
        sb.AppendLine("- Return JSON only.");

        return sb.ToString();
    }

    private static string ExtractJsonObject(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new InvalidOperationException("GenAI returned empty content.");
        }

        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');

        if (start < 0 || end < start)
        {
            throw new InvalidOperationException($"GenAI did not return a valid JSON object. Raw content: {text}");
        }

        return text[start..(end + 1)];
    }

    private static void NormalizeResult(DailyGuidanceLlmResultDto result, DailyGuidanceContextDto context)
    {
        result.Workout ??= new PlanSectionDto();
        result.Meals ??= new PlanSectionDto();

        result.Workout.InitialPlan ??= new List<string>();
        result.Workout.CurrentPlan ??= new List<string>();
        result.Workout.Completed ??= new List<CompletedItemDto>();

        result.Meals.InitialPlan ??= new List<string>();
        result.Meals.CurrentPlan ??= new List<string>();
        result.Meals.Completed ??= new List<CompletedItemDto>();

        result.Summary ??= "Your guidance is ready.";

        result.Workout.InitialPlan = CleanList(result.Workout.InitialPlan);
        result.Workout.CurrentPlan = CleanList(result.Workout.CurrentPlan);
        result.Meals.InitialPlan = CleanList(result.Meals.InitialPlan);
        result.Meals.CurrentPlan = CleanList(result.Meals.CurrentPlan);

        result.Workout.Completed = (context.TodayCompletedWorkouts ?? new List<string>())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => new CompletedItemDto
            {
                Title = x.Trim(),
                TimeLabel = "Logged today",
                Status = "completed"
            })
            .ToList();

        result.Meals.Completed = (context.TodayCompletedMeals ?? new List<string>())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => new CompletedItemDto
            {
                Title = x.Trim(),
                TimeLabel = "Logged today",
                Status = "completed"
            })
            .ToList();

        if (!result.Workout.InitialPlan.Any())
        {
            result.Workout.InitialPlan = new List<string>
            {
                "Short walk or easy movement",
                "Light mobility later in the day"
            };
        }

        if (!result.Workout.CurrentPlan.Any())
        {
            result.Workout.CurrentPlan = result.Workout.InitialPlan.Take(2).ToList();
        }

        if (!result.Meals.InitialPlan.Any())
        {
            result.Meals.InitialPlan = new List<string>
            {
                "Balanced meals with protein and steady carbs",
                "Hydration across the day"
            };
        }

        if (!result.Meals.CurrentPlan.Any())
        {
            result.Meals.CurrentPlan = result.Meals.InitialPlan.Take(2).ToList();
        }
    }

    private static List<string> CleanList(IEnumerable<string>? values)
    {
        return (values ?? Enumerable.Empty<string>())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct()
            .Take(4)
            .ToList();
    }
}