using System.ComponentModel.DataAnnotations;

namespace SchoolSystemTask.DTOs.StudentNoteDTOs;

public class EditStudentNoteDto
{
    [Required]
    public int NoteTypeId { get; set; }
    [Required]
    [StringLength(500, ErrorMessage = "Note cannot exceed 500 characters.")]
    public string Note { get; set; } = string.Empty;
    [Required]
    public int StudentNoteId { get; set; }
}
