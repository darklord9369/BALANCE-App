namespace FitnessPlanner.Api.DTOs.WorkoutLogs;

public class WorkoutLogResponseDto
{
    public long WorkoutLogId { get; set; }
    public long UserId { get; set; }
    public long WorkoutTypeId { get; set; }
    public string WorkoutTypeName { get; set; } = null!;
    public long? EventId { get; set; }
    public DateOnly WorkoutDate { get; set; }
    public int? DurationMinutes { get; set; }
    public string? PerceivedIntensity { get; set; }
    public int? EffortScore { get; set; }
    public string? SkipReason { get; set; }
    public string Source { get; set; } = null!;
    public string? Notes { get; set; }
    public string Status { get; set; } = null!;
}
