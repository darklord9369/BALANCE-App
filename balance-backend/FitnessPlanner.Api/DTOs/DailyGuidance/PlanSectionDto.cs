namespace FitnessPlanner.Api.DTOs.DailyGuidance;

public class PlanSectionDto
{
    public List<string> InitialPlan { get; set; } = new();
    public List<string> CurrentPlan { get; set; } = new();
    public List<CompletedItemDto> Completed { get; set; } = new();
}