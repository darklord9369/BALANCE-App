namespace FitnessPlanner.Api.Models;

public class WeeklySummary : BaseEntity
{
    public long WeeklySummaryId { get; set; }
    public long UserId { get; set; }
    public DateOnly WeekStartDate { get; set; }
    public DateOnly WeekEndDate { get; set; }
    public decimal? AvgEnergyLevel { get; set; }
    public decimal? AvgStressLevel { get; set; }
    public decimal? AvgRecoveryLevel { get; set; }
    public int TotalWorkouts { get; set; }
    public int TotalMealsLogged { get; set; }
    public string? SummaryText { get; set; }

    public User User { get; set; } = null!;
}
