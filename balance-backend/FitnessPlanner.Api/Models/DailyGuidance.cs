namespace FitnessPlanner.Api.Models;

public class DailyGuidance
{
    public long DailyGuidanceId { get; set; }
    public long UserId { get; set; }
    public DateOnly GuidanceDate { get; set; }

    public string InitialWorkoutPlanJson { get; set; } = "[]";
    public string CurrentWorkoutPlanJson { get; set; } = "[]";

    public string InitialMealPlanJson { get; set; } = "[]";
    public string CurrentMealPlanJson { get; set; } = "[]";

    public string CompletedWorkoutsJson { get; set; } = "[]";
    public string CompletedMealsJson { get; set; } = "[]";

    public string SummaryText { get; set; } = string.Empty;
    public string? ModelVersion { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }

    public User User { get; set; } = null!;
}