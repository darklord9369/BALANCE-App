using System.ComponentModel.DataAnnotations;

namespace FitnessPlanner.Api.DTOs.WellnessLogs;

public class CreateWellnessLogDto
{
    [Required]
    public long UserId { get; set; }
    [Required]
    public DateOnly LogDate { get; set; }
    [Range(1, 10)]
    public int EnergyLevel { get; set; }
    [Range(1, 10)]
    public int StressLevel { get; set; }
    [Range(1, 10)]
    public int RecoveryLevel { get; set; }
    [Range(0, 24)]
    public decimal? SleepHours { get; set; }
    [MaxLength(30)]
    public string? Mood { get; set; }
    public string? Notes { get; set; }
}
