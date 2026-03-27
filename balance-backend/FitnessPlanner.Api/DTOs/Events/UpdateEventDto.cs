using System.ComponentModel.DataAnnotations;

namespace FitnessPlanner.Api.DTOs.Events;

public class UpdateEventDto
{
    [Required, MaxLength(150)]
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    [Required]
    public DateOnly StartDate { get; set; }
    [Required]
    public DateOnly EndDate { get; set; }
    [MaxLength(20)]
    public string StressLevel { get; set; } = "moderate";
    [MaxLength(20)]
    public string Status { get; set; } = "active";
}
