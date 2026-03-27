using System.ComponentModel.DataAnnotations;

namespace FitnessPlanner.Api.DTOs.WellnessLogs;

public class UpdateWellnessLogDto
{
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
    [MaxLength(20)]
    public string Status { get; set; } = "active";
}
