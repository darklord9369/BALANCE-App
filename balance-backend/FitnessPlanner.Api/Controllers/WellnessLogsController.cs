using FitnessPlanner.Api.Data;
using FitnessPlanner.Api.DTOs.WellnessLogs;
using FitnessPlanner.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WellnessLogsController : ControllerBase
{
    private readonly AppDbContext _db;
    public WellnessLogsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] long? userId)
    {
        var query = _db.WellnessLogs.Where(x => x.DeletedAt == null);
        if (userId.HasValue) query = query.Where(x => x.UserId == userId.Value);
        var items = await query.OrderByDescending(x => x.LogDate).ToListAsync();
        return Ok(items.Select(Map));
    }

    [HttpGet("{id:long}")]
    public async Task<IActionResult> GetById(long id)
    {
        var item = await _db.WellnessLogs.FirstOrDefaultAsync(x => x.WellnessLogId == id && x.DeletedAt == null);
        return item == null ? NotFound() : Ok(Map(item));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateWellnessLogDto dto)
    {
        var exists = await _db.WellnessLogs.AnyAsync(x => x.UserId == dto.UserId && x.LogDate == dto.LogDate && x.DeletedAt == null);
        if (exists) return BadRequest(new { message = "A wellness log already exists for this date." });
        var item = new WellnessLog
        {
            UserId = dto.UserId,
            LogDate = dto.LogDate,
            EnergyLevel = dto.EnergyLevel,
            StressLevel = dto.StressLevel,
            RecoveryLevel = dto.RecoveryLevel,
            SleepHours = dto.SleepHours,
            Mood = dto.Mood,
            Notes = dto.Notes
        };
        _db.WellnessLogs.Add(item);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = item.WellnessLogId }, Map(item));
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, UpdateWellnessLogDto dto)
    {
        var item = await _db.WellnessLogs.FirstOrDefaultAsync(x => x.WellnessLogId == id && x.DeletedAt == null);
        if (item == null) return NotFound();
        item.EnergyLevel = dto.EnergyLevel;
        item.StressLevel = dto.StressLevel;
        item.RecoveryLevel = dto.RecoveryLevel;
        item.SleepHours = dto.SleepHours;
        item.Mood = dto.Mood;
        item.Notes = dto.Notes;
        item.Status = dto.Status;
        await _db.SaveChangesAsync();
        return Ok(Map(item));
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id)
    {
        var item = await _db.WellnessLogs.FirstOrDefaultAsync(x => x.WellnessLogId == id && x.DeletedAt == null);
        if (item == null) return NotFound();
        item.DeletedAt = DateTime.UtcNow;
        item.Status = "deleted";
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static WellnessLogResponseDto Map(WellnessLog w) => new()
    {
        WellnessLogId = w.WellnessLogId,
        UserId = w.UserId,
        LogDate = w.LogDate,
        EnergyLevel = w.EnergyLevel,
        StressLevel = w.StressLevel,
        RecoveryLevel = w.RecoveryLevel,
        SleepHours = w.SleepHours,
        Mood = w.Mood,
        Notes = w.Notes,
        Status = w.Status
    };
}
