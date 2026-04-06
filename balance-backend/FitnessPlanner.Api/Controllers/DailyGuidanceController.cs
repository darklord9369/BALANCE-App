using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FitnessPlanner.Api.DTOs.DailyGuidance;
using FitnessPlanner.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessPlanner.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DailyGuidanceController : ControllerBase
{
    private readonly IDailyGuidanceService _dailyGuidanceService;

    public DailyGuidanceController(IDailyGuidanceService dailyGuidanceService)
    {
        _dailyGuidanceService = dailyGuidanceService;
    }

    [HttpPost("generate")]
    public async Task<ActionResult<DailyGuidanceResponseDto>> Generate([FromQuery] DateOnly selectedDate)
    {
        var userIdClaim =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue(JwtRegisteredClaimNames.Sub) ??
            User.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Invalid user token." });
        }

        var result = await _dailyGuidanceService.GenerateOrRefreshAsync(userId, selectedDate);
        return Ok(result);
    }
}