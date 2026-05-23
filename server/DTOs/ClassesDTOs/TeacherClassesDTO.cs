using SchoolSystemTask.Models;

namespace SchoolSystemTask.DTOs.ClassesDTOs;

public class TeacherClassesDto
{
    public IEnumerable<Class> Classes { get; set; }
    public IEnumerable<Subject> Subjects { get; set; }
    public IEnumerable<Grade> Grades { get; set; }
    public IEnumerable<Section> Sections { get; set; }
}