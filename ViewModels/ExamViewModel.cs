using SchoolSystemTask.DTOs.ClassesDTOs;
using SchoolSystemTask.Models;

namespace SchoolSystemTask.ViewModels;

public class ExamViewModel
{
    required public List<Exam> Exams;
    required public TeacherClassesDto Classes;

}