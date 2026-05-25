namespace SchoolSystemTask.DTOs.StudentNoteDTOs;

public class CreateStudentNoteDto
{
    public string Note { get; set; } = string.Empty; // Not Null

    public int NoteTypeId { get; set; } // Foreign Key

    public int StudentId { get; set; } // Foreign Key
}
