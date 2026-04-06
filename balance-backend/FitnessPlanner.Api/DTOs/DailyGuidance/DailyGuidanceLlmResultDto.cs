namespace FitnessPlanner.Api.DTOs.DailyGuidance;

public class DailyGuidanceLlmResultDto
{
    public PlanSectionDto Workout { get; set; } = new();
    public PlanSectionDto Meals { get; set; } = new();
    public string Summary { get; set; } = string.Empty;
}