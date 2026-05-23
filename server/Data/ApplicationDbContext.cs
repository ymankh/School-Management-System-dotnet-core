using Microsoft.EntityFrameworkCore;

namespace SchoolSystemTask.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
}
