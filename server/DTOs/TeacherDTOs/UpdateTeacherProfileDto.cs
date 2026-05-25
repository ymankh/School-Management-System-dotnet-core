using System.ComponentModel.DataAnnotations;

namespace SchoolSystemTask.DTOs.TeacherDTOs;
public class UpdateTeacherProfileDto
{
    [Required]
    public string FullName { get; set; } = string.Empty;

    [Required]
    public string Specialty { get; set; } = string.Empty;

    [Required]
    public string Mobile { get; set; } = string.Empty;

    [Required]
    public string Location { get; set; } = string.Empty;

    [Required]
    public string Bio { get; set; } = string.Empty;

    public string? Facebook { get; set; }
    public string? Twitter { get; set; }
    public string? Instagram { get; set; }
    public IFormFile? ProfileImage { get; set; }
}


