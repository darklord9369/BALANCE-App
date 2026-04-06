using FitnessPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessPlanner.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<EventType> EventTypes => Set<EventType>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<WorkoutType> WorkoutTypes => Set<WorkoutType>();
    public DbSet<WorkoutLog> WorkoutLogs => Set<WorkoutLog>();
    public DbSet<MealCategory> MealCategories => Set<MealCategory>();
    public DbSet<MealLog> MealLogs => Set<MealLog>();
    public DbSet<WellnessLog> WellnessLogs => Set<WellnessLog>();
    public DbSet<WeeklySummary> WeeklySummaries => Set<WeeklySummary>();
    public DbSet<RecommendationType> RecommendationTypes => Set<RecommendationType>();
    public DbSet<Recommendation> Recommendations => Set<Recommendation>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Integration> Integrations => Set<Integration>();
    public DbSet<SummaryEvent> SummaryEvents => Set<SummaryEvent>();
    public DbSet<RecommendationEventLink> RecommendationEventLinks => Set<RecommendationEventLink>();
    public DbSet<DailyGuidance> DailyGuidances => Set<DailyGuidance>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(x => x.UserId);
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.Email).IsRequired();
            entity.Property(x => x.PasswordHash).IsRequired();
            entity.Property(x => x.FirstName).IsRequired();
        });

        modelBuilder.Entity<UserProfile>(entity =>
        {
            entity.HasKey(x => x.ProfileId);
            entity.HasIndex(x => x.UserId).IsUnique();
            entity.HasOne(x => x.User)
                .WithOne(x => x.Profile)
                .HasForeignKey<UserProfile>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EventType>(entity =>
        {
            entity.HasKey(x => x.EventTypeId);
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<Event>(entity =>
{
    entity.HasKey(x => x.EventId);
    entity.HasOne(x => x.User)
        .WithMany(x => x.Events)
        .HasForeignKey(x => x.UserId)
        .OnDelete(DeleteBehavior.Cascade);
    entity.HasOne(x => x.EventType)
        .WithMany(x => x.Events)
        .HasForeignKey(x => x.EventTypeId)
        .OnDelete(DeleteBehavior.Restrict);
    entity.ToTable(t => t.HasCheckConstraint("CK_Event_EndDate", @"""EndDate"" >= ""StartDate"""));
});

        modelBuilder.Entity<WorkoutType>(entity =>
        {
            entity.HasKey(x => x.WorkoutTypeId);
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<WorkoutLog>(entity =>
        {
            entity.HasKey(x => x.WorkoutLogId);
            entity.HasOne(x => x.User)
                .WithMany(x => x.WorkoutLogs)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.WorkoutType)
                .WithMany(x => x.WorkoutLogs)
                .HasForeignKey(x => x.WorkoutTypeId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Event)
                .WithMany()
                .HasForeignKey(x => x.EventId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.ToTable(t => t.HasCheckConstraint("CK_WorkoutLog_DurationMinutes", @"""DurationMinutes"" IS NULL OR ""DurationMinutes"" >= 0"));
            entity.ToTable(t => t.HasCheckConstraint("CK_WorkoutLog_EffortScore", @"""EffortScore"" IS NULL OR ""EffortScore"" BETWEEN 1 AND 10"));
        });

        modelBuilder.Entity<MealCategory>(entity =>
        {
            entity.HasKey(x => x.MealCategoryId);
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<MealLog>(entity =>
        {
            entity.HasKey(x => x.MealLogId);
            entity.HasOne(x => x.User)
                .WithMany(x => x.MealLogs)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.MealCategory)
                .WithMany(x => x.MealLogs)
                .HasForeignKey(x => x.MealCategoryId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Event)
                .WithMany()
                .HasForeignKey(x => x.EventId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<WellnessLog>(entity =>
        {
            entity.HasKey(x => x.WellnessLogId);
            entity.HasIndex(x => new { x.UserId, x.LogDate }).IsUnique();
            entity.HasOne(x => x.User)
                .WithMany(x => x.WellnessLogs)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.ToTable(t => t.HasCheckConstraint("CK_WellnessLog_EnergyLevel", @"""EnergyLevel"" BETWEEN 1 AND 10"));
            entity.ToTable(t => t.HasCheckConstraint("CK_WellnessLog_StressLevel", @"""StressLevel"" BETWEEN 1 AND 10"));
            entity.ToTable(t => t.HasCheckConstraint("CK_WellnessLog_RecoveryLevel", @"""RecoveryLevel"" BETWEEN 1 AND 10"));
        });
        modelBuilder.Entity<WeeklySummary>(entity =>
        {
            entity.HasKey(x => x.WeeklySummaryId);
            entity.HasIndex(x => new { x.UserId, x.WeekStartDate }).IsUnique();
            entity.HasOne(x => x.User)
                .WithMany(x => x.WeeklySummaries)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RecommendationType>(entity =>
        {
            entity.HasKey(x => x.RecommendationTypeId);
            entity.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<SummaryEvent>(entity =>
        {
            entity.HasKey(x => x.SummaryEventId);
            entity.HasIndex(x => new { x.WeeklySummaryId, x.EventId }).IsUnique();
        });

        modelBuilder.Entity<RecommendationEventLink>(entity =>
        {
            entity.HasKey(x => x.RecommendationEventLinkId);
            entity.HasIndex(x => new { x.RecommendationId, x.EventId }).IsUnique();
        });
        
        modelBuilder.Entity<DailyGuidance>(entity =>
{
    entity.HasKey(x => x.DailyGuidanceId);

    entity.HasIndex(x => new { x.UserId, x.GuidanceDate }).IsUnique();

    entity.Property(x => x.InitialWorkoutPlanJson).HasColumnType("text");
    entity.Property(x => x.CurrentWorkoutPlanJson).HasColumnType("text");
    entity.Property(x => x.InitialMealPlanJson).HasColumnType("text");
    entity.Property(x => x.CurrentMealPlanJson).HasColumnType("text");
    entity.Property(x => x.CompletedWorkoutsJson).HasColumnType("text");
    entity.Property(x => x.CompletedMealsJson).HasColumnType("text");
    entity.Property(x => x.SummaryText).HasColumnType("text");

    entity.HasOne(x => x.User)
        .WithMany()
        .HasForeignKey(x => x.UserId)
        .OnDelete(DeleteBehavior.Cascade);
});
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries<BaseEntity>();
        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }
    }
}
