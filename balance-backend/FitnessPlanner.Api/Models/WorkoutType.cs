namespace FitnessPlanner.Api.Models;

public class WorkoutType : BaseEntity
{
    public long WorkoutTypeId { get; set; }
    public string Name { get; set; } = null!;
    public string? DefaultIntensityCategory { get; set; }
    public string? Description { get; set; }

    public ICollection<WorkoutLog> WorkoutLogs { get; set; } = new List<WorkoutLog>();
}
