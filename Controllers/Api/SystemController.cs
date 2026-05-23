using Microsoft.AspNetCore.Mvc;

namespace SchoolSystemTask.Controllers.Api;

[ApiController]
[Route("api/system")]
public class SystemController : ControllerBase
{
    [HttpGet("status")]
    public IActionResult GetStatus()
    {
        return Ok(new
        {
            name = "School System API",
            status = "online",
            frontend = "React/Vite",
            backend = ".NET 10 Web API",
            endpoints = new[]
            {
                "GET /api/system/status"
            }
        });
    }
}
