using FitnessPlanner.Api.Data;
using FitnessPlanner.Api.DTOs.Users;
using FitnessPlanner.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db) => _db = db;

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var user = await _db.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.UserId == id && u.DeletedAt == null);

        if (user == null) return NotFound();

        return Ok(new
        {
            user.UserId,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Role,
            user.Timezone,
            Profile = user.Profile == null ? null : new
            {
                user.Profile.UserProfileId,
                user.Profile.UserId,
                user.Profile.Age,
                user.Profile.Sex,
                user.Profile.HeightCm,
                user.Profile.WeightKg,
                user.Profile.ActivityLevel,
                user.Profile.PrimaryGoal,
                user.Profile.TrainingBackground,
                user.Profile.SchoolName,
                user.Profile.TypicalSleepHours,
                user.Profile.DietType,
                user.Profile.IsVegan,
                user.Profile.IsGlutenFree,
                user.Profile.Allergens
            }
        });
    }

    [HttpPut("{id:long}/profile")]
    public async Task<IActionResult> UpsertProfile(long id, UpdateUserProfileDto dto)
    {
        try
        {
            var user = await _db.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.UserId == id && u.DeletedAt == null);

            if (user == null) return NotFound();

            var profile = user.Profile ?? new UserProfile { UserId = id };

            if (dto.Age.HasValue) profile.Age = dto.Age;
            if (dto.Sex != null) profile.Sex = dto.Sex;
            if (dto.HeightCm.HasValue) profile.HeightCm = dto.HeightCm;
            if (dto.WeightKg.HasValue) profile.WeightKg = dto.WeightKg;
            if (dto.ActivityLevel != null) profile.ActivityLevel = dto.ActivityLevel;
            if (dto.PrimaryGoal != null) profile.PrimaryGoal = dto.PrimaryGoal;
            if (dto.TrainingBackground != null) profile.TrainingBackground = dto.TrainingBackground;
            if (dto.SchoolName != null) profile.SchoolName = dto.SchoolName;
            if (dto.TypicalSleepHours.HasValue) profile.TypicalSleepHours = dto.TypicalSleepHours;

            if (dto.DietType != null) profile.DietType = dto.DietType;
            if (dto.IsVegan.HasValue) profile.IsVegan = dto.IsVegan;
            if (dto.IsGlutenFree.HasValue) profile.IsGlutenFree = dto.IsGlutenFree;
            if (dto.Allergens != null) profile.Allergens = dto.Allergens;

            if (user.Profile == null)
            {
                _db.UserProfiles.Add(profile);
            }

            await _db.SaveChangesAsync();

            return Ok(new
            {
                profile.UserProfileId,
                profile.UserId,
                profile.Age,
                profile.Sex,
                profile.HeightCm,
                profile.WeightKg,
                profile.ActivityLevel,
                profile.PrimaryGoal,
                profile.TrainingBackground,
                profile.SchoolName,
                profile.TypicalSleepHours,
                profile.DietType,
                profile.IsVegan,
                profile.IsGlutenFree,
                profile.Allergens
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = ex.Message,
                inner = ex.InnerException?.Message
            });
        }
    }
}