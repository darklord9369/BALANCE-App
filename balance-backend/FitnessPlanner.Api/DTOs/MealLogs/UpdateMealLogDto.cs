using System.ComponentModel.DataAnnotations;

namespace FitnessPlanner.Api.DTOs.MealLogs;

public class UpdateMealLogDto
{
    [Required]
    public long MealCategoryId { get; set; }
    public long? EventId { get; set; }
    [Required]
    public DateOnly MealDate { get; set; }
    [MaxLength(20)]
    public string? MealTime { get; set; }
    public string? Notes { get; set; }
    [MaxLength(30)]
    public string Source { get; set; } = "manual";
    [MaxLength(20)]
    public string Status { get; set; } = "logged";
}
