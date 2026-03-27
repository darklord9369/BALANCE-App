using System.ComponentModel.DataAnnotations;

namespace FitnessPlanner.Api.DTOs.WorkoutLogs;

public class CreateWorkoutLogDto
{
    [Required]
    public long UserId { get; set; }
    [Required]
    public long WorkoutTypeId { get; set; }
    public long? EventId { get; set; }
    [Required]
    public DateOnly WorkoutDate { get; set; }
    [Range(0, 1440)]
    public int? DurationMinutes { get; set; }
    [MaxLength(20)]
    public string? PerceivedIntensity { get; set; }
    [Range(1, 10)]
    public int? EffortScore { get; set; }
    [MaxLength(100)]
    public string? SkipReason { get; set; }
    [MaxLength(30)]
    public string Source { get; set; } = "manual";
    public string? Notes { get; set; }
    [MaxLength(20)]
    public string Status { get; set; } = "completed";
}
