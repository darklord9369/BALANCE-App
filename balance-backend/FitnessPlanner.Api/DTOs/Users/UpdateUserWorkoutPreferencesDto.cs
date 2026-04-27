namespace FitnessPlanner.Api.DTOs.Users;

public class UpdateUserWorkoutPreferencesDto
{
    public long? WorkoutPreferenceId { get; set; }
    public int? PreferredWorkoutDurationMinutes { get; set; }
}