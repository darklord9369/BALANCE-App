namespace FitnessPlanner.Api.DTOs.MealLogs;

public class MealLogResponseDto
{
    public long MealLogId { get; set; }
    public long UserId { get; set; }
    public long MealCategoryId { get; set; }
    public string MealCategoryName { get; set; } = null!;
    public long? EventId { get; set; }
    public DateOnly MealDate { get; set; }
    public string? MealTime { get; set; }
    public string? Notes { get; set; }
    public string Source { get; set; } = null!;
    public string Status { get; set; } = null!;
}
