using SchoolSystemTask.Models;

namespace SchoolSystemTask.ViewModels;

public class HomeViewModel
{
    required public IEnumerable<Student> Students { get; set; }
    required public IEnumerable<StudentNote> StudentNotes { get; set; }
    required public int AbsencesCount { get; set; }
    required public int AssignmentCount { get; set; }
}
