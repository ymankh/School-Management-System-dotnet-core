using System.ComponentModel.DataAnnotations;

namespace SchoolSystemTask.DTOs.TeacherDTOs;
public class UpdateTeacherProfileDto
{
    [Required]
    public string FullName { get; set; }

    [Required]
    public string Specialty { get; set; }

    [Required]
    public string Mobile { get; set; }

    [Required]
    public string Location { get; set; }

    [Required]
    public string Bio { get; set; }

    public string? Facebook { get; set; }
    public string? Twitter { get; set; }
    public string? Instagram { get; set; }
    public IFormFile? ProfileImage { get; set; }
}


