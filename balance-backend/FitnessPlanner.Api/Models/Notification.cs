namespace FitnessPlanner.Api.Models;

public class Notification : BaseEntity
{
    public long NotificationId { get; set; }
    public long UserId { get; set; }
    public long RecommendationId { get; set; }
    public string Channel { get; set; } = "in_app";
    public DateTime ScheduledAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? ReadAt { get; set; }
}
