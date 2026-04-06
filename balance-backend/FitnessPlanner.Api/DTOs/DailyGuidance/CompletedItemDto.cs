namespace FitnessPlanner.Api.DTOs.DailyGuidance;

public class CompletedItemDto
{
    public string Title { get; set; } = string.Empty;
    public string TimeLabel { get; set; } = string.Empty;
    public string Status { get; set; } = "completed";
}