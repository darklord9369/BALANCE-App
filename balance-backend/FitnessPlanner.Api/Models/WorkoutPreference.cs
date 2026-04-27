namespace FitnessPlanner.Api.Models;

public class WorkoutPreference
{
    public long WorkoutPreferenceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime? DeletedAt { get; set; }
}