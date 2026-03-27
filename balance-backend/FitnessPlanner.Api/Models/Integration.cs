namespace FitnessPlanner.Api.Models;

public class Integration : BaseEntity
{
    public long IntegrationId { get; set; }
    public long UserId { get; set; }
    public string Provider { get; set; } = null!;
    public string? ExternalUserRef { get; set; }
    public string? AccessTokenHash { get; set; }
    public string? RefreshTokenHash { get; set; }
    public DateTime? LastSyncedAt { get; set; }
}
