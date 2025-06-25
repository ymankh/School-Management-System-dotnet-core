namespace SchoolSystemTask.DTOs.StudentNoteDTOs;

public class CreateStudentNoteDto
{
    public string Note { get; set; } // Not Null

    public int NoteTypeId { get; set; } // Foreign Key

    public int StudentId { get; set; } // Foreign Key
}
