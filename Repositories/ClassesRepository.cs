using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using SchoolSystemTask.DTOs.ClassesDTOs;
using SchoolSystemTask.Models;
using SchoolSystemTask.Models.StaticData;

namespace SchoolSystemTask.Repositories;

public class ClassesRepository(MyDbContext context)
{
    public List<Class> GetTeacherClasses(int teacherId)
    {
        return [.. context.Classes.Include(c => c.ClassSubjects).ThenInclude(c => c.TeacherSubject.Subject).
                             // Get the teacher classes or any classes that the take a subject with that teacher.
                             Where(c => c.TeacherId == teacherId || c.ClassSubjects.Any(cs => cs.TeacherSubjectId == teacherId))];
    }
    public TeacherClassesDto GetClasses(int teacherId)
    {
        return new TeacherClassesDto
        {
            Classes = GetTeacherClasses(teacherId),
            Subjects = [.. context.Subjects],
            Sections = [.. context.Sections],
            Grades = [.. context.Grades]
        };
    }

    public Class CreateClass(AddClassDto addClassDto, int teacherId)
    {
        var oldClass = context.Classes.FirstOrDefault(
            c => c.GradeId == addClassDto.GradeId && c.SectionId == addClassDto.SectionId &&
                 c.TeacherId == teacherId);
        if (oldClass != null)
        {
            return oldClass;
        }

        var newClass = new Class
        {
            GradeId = addClassDto.GradeId,
            SectionId = addClassDto.SectionId,
            TeacherId = teacherId
        };
        context.Classes.Add(newClass);
        context.ActionHistories.Add(new ActionHistory
        {
            Name = ActionNames.CreateClass,
            Description = "Added a new class.",
            UserId = context.UserTeachers.First(u => u.TeacherId == teacherId).UserTeacherId,
        });
        context.SaveChanges();
        return newClass;
    }

    public TeacherClassesDto CreateSubject(AddSubjectToClassDto addSubjectDto, int teacherId)
    {
        // Check wether the class subject already exists or not.

        var oldClassSubject =
            context.ClassSubjects.FirstOrDefault(cs =>
                cs.TeacherSubject.SubjectId == addSubjectDto.SubjectId && cs.ClassId == addSubjectDto.ClassId);
        if (oldClassSubject != null)
            return GetClasses(teacherId);

        // Get or create teacher subject
        var teacherSubject = context.TeacherSubjects.FirstOrDefault(ts =>
            ts.SubjectId == addSubjectDto.SubjectId && ts.TeacherId == teacherId);
        if (teacherSubject == null)
        {
            teacherSubject = new TeacherSubject
            {
                SubjectId = addSubjectDto.SubjectId,
                TeacherId = teacherId
            };
            context.TeacherSubjects.Add(teacherSubject);
            context.SaveChanges();
        }

        var classSubject = new ClassSubject
        {
            ClassId = addSubjectDto.ClassId,
            TeacherSubjectId = teacherSubject.Id
        };
        context.ClassSubjects.Add(classSubject);
        context.ActionHistories.Add(new ActionHistory
        {
            Name = ActionNames.CreateClassSubject,
            Description = "Added a new class subject.",
            UserId = context.UserTeachers.First(u => u.TeacherId == teacherId).UserTeacherId
        });
        context.SaveChanges();
        return GetClasses(teacherId);
    }

    public List<ClassSubject> GetClassSubjects(int id)
    {
        return context.ClassSubjects.Include(cs => cs.TeacherSubject.Subject).Where(cs => cs.ClassId == id)
            .ToList();
    }
}