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
public class GuidanceSummaryController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;

    public GuidanceSummaryController(
        AppDbContext db,
        IHttpClientFactory httpClientFactory,
        IConfiguration config)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _config = config;
    }

    [HttpPost("generate")]
    public async Task<IActionResult> Generate(
        [FromQuery] long userId,
        [FromQuery] DateOnly selectedDate)
    {
        try
        {
            var apiKey = _config["GenAI:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return StatusCode(500, new
                {
                    message = "GenAI API key is not configured on the server."
                });
            }

            var events = await _db.Events
                .Include(x => x.EventType)
                .Where(x =>
                    x.UserId == userId &&
                    x.DeletedAt == null &&
                    x.StartDate <= selectedDate &&
                    x.EndDate >= selectedDate)
                .OrderBy(x => x.StartDate)
                .ToListAsync();

            var prompt = BuildGuidancePrompt(selectedDate, events);
            var summaryText = await GenerateGuidanceSummaryAsync(apiKey, prompt);

            return Ok(new
            {
                userId,
                selectedDate,
                eventCount = events.Count,
                summary = summaryText
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Guidance summary generation failed.",
                detail = ex.Message,
                inner = ex.InnerException?.Message,
                stack = ex.StackTrace
            });
        }
    }

    private async Task<string> GenerateGuidanceSummaryAsync(string apiKey, string prompt)
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
                    content = "You are BALANCE, a supportive student fitness and nutrition planning assistant. Return exactly 2 to 3 short sentences only. No bullets. No heading. Be practical, stress-aware, and guilt-free."
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
                var generated = content.GetString()?.Trim() ?? "";
                return FormatGuidanceSummary(generated);
            }

            throw new Exception($"Unexpected GenAI response format: {raw}");
        }
        catch (JsonException)
        {
            throw new Exception($"Invalid JSON returned by GenAI API: {raw}");
        }
    }

    private static string BuildGuidancePrompt(DateOnly selectedDate, List<Event> events)
    {
        var sb = new StringBuilder();

        sb.AppendLine($"Selected date: {selectedDate:yyyy-MM-dd}");
        sb.AppendLine();
        sb.AppendLine("Scheduled events for this day:");

        if (events.Any())
        {
            foreach (var item in events)
            {
                sb.AppendLine(
                    $"Title={item.Title}, Type={item.EventType?.Name}, StressLevel={item.StressLevel}, StartDate={item.StartDate:yyyy-MM-dd}, EndDate={item.EndDate:yyyy-MM-dd}, Description={item.Description ?? "None"}");
            }
        }
        else
        {
            sb.AppendLine("No academic, deadline, race, or training events are scheduled for this date.");
        }

        sb.AppendLine();
        sb.AppendLine("Task:");
        sb.AppendLine("Create a generic guidance summary for the selected day.");
        sb.AppendLine();
        sb.AppendLine("Rules:");
        sb.AppendLine("Return exactly 2 to 3 short sentences.");
        sb.AppendLine("Base the guidance only on the scheduled events for the selected day.");
        sb.AppendLine("Mention how the event context may affect workout or fueling choices.");
        sb.AppendLine("Be supportive, practical, and non-judgmental.");
        sb.AppendLine("Avoid guilt-based language.");
        sb.AppendLine("Avoid medical advice.");
        sb.AppendLine("Do not mention exact calories, macros, grams, or strict prescriptions.");
        sb.AppendLine("Do not include bullets, headings, labels, markdown, or quotation marks.");
        sb.AppendLine("If there are no events, give a calm balanced-routine summary.");

        return sb.ToString();
    }

    private static string FormatGuidanceSummary(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return "No major event is scheduled for this date. Keep your routine balanced with manageable movement, steady meals, and enough recovery.";
        }

        var cleaned = text
            .Replace("Guidance Summary:", "", StringComparison.OrdinalIgnoreCase)
            .Replace("Summary:", "", StringComparison.OrdinalIgnoreCase)
            .Replace("**", "")
            .Replace("*", "")
            .Replace("-", "")
            .Replace("•", "")
            .Trim();

        var sentences = cleaned
            .Split('.', StringSplitOptions.RemoveEmptyEntries)
            .Select(x => x.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Take(3)
            .Select(x => x.EndsWith(".") ? x : x + ".")
            .ToList();

        if (sentences.Count == 0)
        {
            return "No major event is scheduled for this date. Keep your routine balanced with manageable movement, steady meals, and enough recovery.";
        }

        return string.Join(" ", sentences);
    }
}