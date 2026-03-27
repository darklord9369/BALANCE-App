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
        var user = await _db.Users.Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.UserId == id && u.DeletedAt == null);

        return user == null ? NotFound() : Ok(new
        {
            user.UserId,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Role,
            user.Timezone,
            Profile = user.Profile
        });
    }

    [HttpPut("{id:long}/profile")]
    public async Task<IActionResult> UpsertProfile(long id, UpdateUserProfileDto dto)
    {
        var user = await _db.Users.Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.UserId == id && u.DeletedAt == null);
        if (user == null) return NotFound();

        var profile = user.Profile ?? new UserProfile { UserId = id };
        profile.Age = dto.Age;
        profile.Sex = dto.Sex;
        profile.HeightCm = dto.HeightCm;
        profile.WeightKg = dto.WeightKg;
        profile.ActivityLevel = dto.ActivityLevel;
        profile.PrimaryGoal = dto.PrimaryGoal;
        profile.TrainingBackground = dto.TrainingBackground;
        profile.SchoolName = dto.SchoolName;
        profile.TypicalSleepHours = dto.TypicalSleepHours;

        if (user.Profile == null) _db.UserProfiles.Add(profile);
        await _db.SaveChangesAsync();
        return Ok(profile);
    }
}
