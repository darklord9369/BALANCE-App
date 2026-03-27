using FitnessPlanner.Api.Data;
using FitnessPlanner.Api.DTOs.WorkoutLogs;
using FitnessPlanner.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkoutLogsController : ControllerBase
{
    private readonly AppDbContext _db;
    public WorkoutLogsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] long? userId)
    {
        var query = _db.WorkoutLogs.Include(w => w.WorkoutType).Where(w => w.DeletedAt == null);
        if (userId.HasValue) query = query.Where(w => w.UserId == userId.Value);
        var items = await query.OrderByDescending(w => w.WorkoutDate).ToListAsync();
        return Ok(items.Select(Map));
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var item = await _db.WorkoutLogs.Include(w => w.WorkoutType).FirstOrDefaultAsync(w => w.WorkoutLogId == id && w.DeletedAt == null);
        return item == null ? NotFound() : Ok(Map(item));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateWorkoutLogDto dto)
    {
        if (!await _db.Users.AnyAsync(u => u.UserId == dto.UserId && u.DeletedAt == null)) return BadRequest(new { message = "User not found." });
        if (!await _db.WorkoutTypes.AnyAsync(x => x.WorkoutTypeId == dto.WorkoutTypeId && x.DeletedAt == null)) return BadRequest(new { message = "Workout type not found." });
        var item = new WorkoutLog
        {
            UserId = dto.UserId,
            WorkoutTypeId = dto.WorkoutTypeId,
            EventId = dto.EventId,
            WorkoutDate = dto.WorkoutDate,
            DurationMinutes = dto.DurationMinutes,
            PerceivedIntensity = dto.PerceivedIntensity,
            EffortScore = dto.EffortScore,
            SkipReason = dto.SkipReason,
            Source = dto.Source,
            Notes = dto.Notes,
            Status = dto.Status
        };
        _db.WorkoutLogs.Add(item);
        await _db.SaveChangesAsync();
        item = await _db.WorkoutLogs.Include(w => w.WorkoutType).FirstAsync(w => w.WorkoutLogId == item.WorkoutLogId);
        return CreatedAtAction(nameof(GetById), new { id = item.WorkoutLogId }, Map(item));
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, UpdateWorkoutLogDto dto)
    {
        var item = await _db.WorkoutLogs.Include(w => w.WorkoutType).FirstOrDefaultAsync(w => w.WorkoutLogId == id && w.DeletedAt == null);
        if (item == null) return NotFound();
        item.WorkoutTypeId = dto.WorkoutTypeId;
        item.EventId = dto.EventId;
        item.WorkoutDate = dto.WorkoutDate;
        item.DurationMinutes = dto.DurationMinutes;
        item.PerceivedIntensity = dto.PerceivedIntensity;
        item.EffortScore = dto.EffortScore;
        item.SkipReason = dto.SkipReason;
        item.Source = dto.Source;
        item.Notes = dto.Notes;
        item.Status = dto.Status;
        await _db.SaveChangesAsync();
        item = await _db.WorkoutLogs.Include(w => w.WorkoutType).FirstAsync(w => w.WorkoutLogId == id);
        return Ok(Map(item));
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var item = await _db.WorkoutLogs.FirstOrDefaultAsync(w => w.WorkoutLogId == id && w.DeletedAt == null);
        if (item == null) return NotFound();
        item.DeletedAt = DateTime.UtcNow;
        item.Status = "deleted";
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static WorkoutLogResponseDto Map(WorkoutLog w) => new()
    {
        WorkoutLogId = w.WorkoutLogId,
        UserId = w.UserId,
        WorkoutTypeId = w.WorkoutTypeId,
        WorkoutTypeName = w.WorkoutType.Name,
        EventId = w.EventId,
        WorkoutDate = w.WorkoutDate,
        DurationMinutes = w.DurationMinutes,
        PerceivedIntensity = w.PerceivedIntensity,
        EffortScore = w.EffortScore,
        SkipReason = w.SkipReason,
        Source = w.Source,
        Notes = w.Notes,
        Status = w.Status
    };
}
