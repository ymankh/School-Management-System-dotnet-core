using SchoolSystemTask.DTOs.ExamMarksDTOs;
using SchoolSystemTask.Models;

namespace SchoolSystemTask.ViewModels;

public class ExamMarksViewModel
{
    public List<Student> Students { get; set; }
    public Class Class { get; set; }
    public Exam Exam { get; set; }

    public List<AddExamMarkDto> ExamWithMarks { get; set; }
}