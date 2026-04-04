using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using FitnessPlanner.Api.Data;
using FitnessPlanner.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WeeklySummariesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;

    public WeeklySummariesController(
        AppDbContext db,
        IHttpClientFactory httpClientFactory,
        IConfiguration config)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _config = config;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate([FromQuery] long userId, [FromQuery] DateOnly weekStartDate)
    {
        try
        {
            var apiKey = _config["GenAI:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return StatusCode(500, new { message = "GenAI API key is not configured on the server." });
            }

            var weekEndDate = weekStartDate.AddDays(6);

            var summary = await _db.WeeklySummaries
                .FirstOrDefaultAsync(x =>
                    x.UserId == userId &&
                    x.WeekStartDate == weekStartDate &&
                    x.DeletedAt == null);

            var latestWorkoutUpdate = await _db.WorkoutLogs
                .Where(x =>
                    x.UserId == userId &&
                    x.WorkoutDate >= weekStartDate &&
                    x.WorkoutDate <= weekEndDate)
                .Select(x => (DateTime?)x.UpdatedAt)
                .MaxAsync();

            var latestMealUpdate = await _db.MealLogs
                .Where(x =>
                    x.UserId == userId &&
                    x.MealDate >= weekStartDate &&
                    x.MealDate <= weekEndDate)
                .Select(x => (DateTime?)x.UpdatedAt)
                .MaxAsync();

            var latestEventUpdate = await _db.Events
                .Where(x =>
                    x.UserId == userId &&
                    x.StartDate <= weekEndDate &&
                    x.EndDate >= weekStartDate)
                .Select(x => (DateTime?)x.UpdatedAt)
                .MaxAsync();

            DateTime? maxSourceUpdatedAt = new[]
            {
                latestWorkoutUpdate,
                latestMealUpdate,
                latestEventUpdate
            }
            .Where(x => x.HasValue)
            .DefaultIfEmpty()
            .Max();

            if (summary != null)
            {
                var isFresh =
                    !maxSourceUpdatedAt.HasValue ||
                    summary.UpdatedAt >= maxSourceUpdatedAt.Value;

                if (isFresh)
                {
                    return Ok(summary);
                }
            }

            var workouts = await _db.WorkoutLogs
                .Include(x => x.WorkoutType)
                .Where(x => x.UserId == userId &&
                            x.WorkoutDate >= weekStartDate &&
                            x.WorkoutDate <= weekEndDate &&
                            x.DeletedAt == null)
                .ToListAsync();

            var meals = await _db.MealLogs
                .Include(x => x.MealCategory)
                .Where(x => x.UserId == userId &&
                            x.MealDate >= weekStartDate &&
                            x.MealDate <= weekEndDate &&
                            x.DeletedAt == null)
                .ToListAsync();

            var events = await _db.Events
                .Include(x=>x.EventType)
                .Where(x => x.UserId == userId &&
                            x.DeletedAt == null &&
                            x.StartDate <= weekEndDate &&
                            x.EndDate >= weekStartDate)
                .ToListAsync();

            if (summary == null)
            {
                summary = new WeeklySummary
                {
                    UserId = userId,
                    WeekStartDate = weekStartDate,
                    WeekEndDate = weekEndDate
                };
                _db.WeeklySummaries.Add(summary);
            }

            summary.WeekEndDate = weekEndDate;
            summary.TotalWorkouts = workouts.Count;
            summary.TotalMealsLogged = meals.Count;

            var prompt = BuildWeeklyPrompt(workouts, meals, events);
            summary.SummaryText = await GenerateFitnessReportAsync(apiKey, prompt);
            summary.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
            return Ok(summary);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Generate failed",
                detail = ex.Message,
                inner = ex.InnerException?.Message,
                stack = ex.StackTrace
            });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] long userId)
    {
        var items = await _db.WeeklySummaries
            .Where(x => x.UserId == userId && x.DeletedAt == null)
            .OrderByDescending(x => x.WeekStartDate)
            .ToListAsync();

        return Ok(items);
    }

    private async Task<string> GenerateFitnessReportAsync(string apiKey, string prompt)
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
                content = "Return exactly 3 bullet points only. No intro. No headings. No labels like Diet suggestion, Workout suggestion, or Sleep/Recovery suggestion. Each bullet should be short, practical, and supportive."
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
                var generated = content.GetString()?.Trim() ?? "No report generated.";
                return FormatSummaryAsBullets(generated);
            }

            throw new Exception($"Unexpected GenAI response format: {raw}");
        }
        catch (JsonException)
        {
            throw new Exception($"Invalid JSON returned by GenAI API: {raw}");
        }
    }
    private static string BuildWeeklyPrompt(
    List<WorkoutLog> workouts,
    List<MealLog> meals,
    List<Event> events)
{
    var sb = new StringBuilder();

    sb.AppendLine("Use these weekly logs to create exactly 3 bullet points:");
    sb.AppendLine("- one for food or meal advice");
    sb.AppendLine("- one for workout advice");
    sb.AppendLine("- one for sleep or recovery advice");
    sb.AppendLine("Do not include any heading or label.");
    sb.AppendLine();

    sb.AppendLine("WORKOUTS:");
    if (workouts.Any())
    {
        foreach (var item in workouts)
        {
            sb.AppendLine(
                $"Type={item.WorkoutType?.Name}, Duration={item.DurationMinutes} min, Intensity={item.PerceivedIntensity}");
        }
    }
    else
    {
        sb.AppendLine("No workouts logged.");
    }

    sb.AppendLine();
    sb.AppendLine("MEALS:");
    if (meals.Any())
    {
        foreach (var item in meals)
        {
            sb.AppendLine(
                $"MealTime={item.MealTime}, Category={item.MealCategory?.Name}");
        }
    }
    else
    {
        sb.AppendLine("No meals logged.");
    }

    sb.AppendLine();
    sb.AppendLine("EVENTS:");
    if (events.Any())
    {
        foreach (var item in events)
        {
            sb.AppendLine(
                $"Title={item.Title}, Type={item.EventType?.Name}, StressLevel={item.StressLevel}");
        }
    }
    else
    {
        sb.AppendLine("No major events logged.");
    }

    sb.AppendLine();
    sb.AppendLine("Rules:");
    sb.AppendLine("Be supportive and stress-aware.");
    sb.AppendLine("Avoid guilt-based language.");
    sb.AppendLine("Prefer lighter workouts if stress is high.");
    sb.AppendLine("Suggest simple balanced meals if routine looks inconsistent.");
    sb.AppendLine("Return exactly 3 bullet points only.");

    return sb.ToString();
}

    private static string FormatSummaryAsBullets(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return "- No summary generated.";

        var cleaned = text
            .Replace("Here's your weekly fitness report:", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Here is your weekly fitness report:", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Diet suggestion:", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Workout suggestion:", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Sleep/Recovery suggestion:", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Sleep recovery suggestion:", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Sleep suggestion:", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Recovery suggestion:", "", StringComparison.OrdinalIgnoreCase)
            .Replace("**", "")
            .Replace("*", "")
            .Trim();

        var lines = cleaned
            .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(x => x.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.TrimStart('-', '•', ' '))
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Take(3)
            .Select(x => $"- {x}")
            .ToList();

        return lines.Count > 0 ? string.Join(Environment.NewLine, lines) : "- No summary generated.";
    }

}