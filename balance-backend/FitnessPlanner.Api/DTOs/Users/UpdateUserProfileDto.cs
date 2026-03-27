using System.ComponentModel.DataAnnotations;

namespace FitnessPlanner.Api.DTOs.Users;

public class UpdateUserProfileDto
{
    [Range(1, 120)]
    public int? Age { get; set; }
    [MaxLength(20)]
    public string? Sex { get; set; }
    [Range(50, 300)]
    public decimal? HeightCm { get; set; }
    [Range(20, 500)]
    public decimal? WeightKg { get; set; }
    [MaxLength(30)]
    public string ActivityLevel { get; set; } = "moderate";
    [MaxLength(50)]
    public string PrimaryGoal { get; set; } = "consistency";
    [MaxLength(50)]
    public string? TrainingBackground { get; set; }
    [MaxLength(150)]
    public string? SchoolName { get; set; }
    [Range(0, 24)]
    public decimal? TypicalSleepHours { get; set; }
}
