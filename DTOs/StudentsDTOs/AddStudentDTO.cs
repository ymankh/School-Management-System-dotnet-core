namespace SchoolSystemTask.DTOs.StudentsDTOs;

public class AddStudentDto
{
    public required string FullName { get; set; }
    public required int ClassId { get; set; }
    public required string ParentContact { get; set; }
    public required string Address { get; set; }
    public required DateOnly BirthDate { get; set; }
    public required string NationalId { get; set; }
}
