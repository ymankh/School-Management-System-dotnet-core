using SchoolSystemTask.DTOs.Filters;
using SchoolSystemTask.Models;

namespace SchoolSystemTask.ViewModels;

public class StudentsViewModel
{
    required public IEnumerable<Student> Students { get; set; }
    required public IEnumerable<Class> Classes { get; set; }
    required public IEnumerable<NoteType> NoteTypes { get; set; }
    required public StudentQueryFilter Filter { get; set; }
}
