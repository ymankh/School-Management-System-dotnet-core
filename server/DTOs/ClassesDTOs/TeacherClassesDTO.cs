namespace SchoolSystemTask.DTOs.ClassesDTOs;

public class TeacherClassesDto
{
    public IEnumerable<TeacherClassOptionDto> Classes { get; set; } = [];
    public IEnumerable<TeacherClassOptionDto> Subjects { get; set; } = [];
    public IEnumerable<TeacherClassOptionDto> Grades { get; set; } = [];
    public IEnumerable<TeacherClassOptionDto> Sections { get; set; } = [];
}

public class TeacherClassOptionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
