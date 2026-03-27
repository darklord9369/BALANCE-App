namespace FitnessPlanner.Api.DTOs.WellnessLogs;

public class WellnessLogResponseDto
{
    public long WellnessLogId { get; set; }
    public long UserId { get; set; }
    public DateOnly LogDate { get; set; }
    public int EnergyLevel { get; set; }
    public int StressLevel { get; set; }
    public int RecoveryLevel { get; set; }
    public decimal? SleepHours { get; set; }
    public string? Mood { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = null!;
}
