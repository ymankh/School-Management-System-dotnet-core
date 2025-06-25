using SchoolSystemTask.Models;

namespace SchoolSystemTask.ViewModels;

public class StudentNoteViewModel
{
    public List<StudentNote> StudentNotes { get; set; }
    public List<NoteType> NoteTypes { get; set; }
}
