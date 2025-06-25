using SchoolSystemTask.DTOs.TeacherDTOs;
using SchoolSystemTask.Models;

namespace SchoolSystemTask.Repositories;

public class TeacherRepository(MyDbContext context)
{
    public Teacher CreateTeacher(string firstName, string lastName)
    {
        var teacher = new Teacher
        {
            FirstName = firstName,
            LastName = lastName,
        };
        context.Teachers.Add(teacher);
        context.SaveChanges();
        return teacher;
    }
    public Teacher? GetTeacherByName(string firstName, string lastName)
    {
        return context.Teachers.FirstOrDefault(t => t.FirstName == firstName && t.LastName == lastName);
    }
    internal void UpdateTeacher(UpdateTeacherProfileDto update, Teacher teacher)
    {
        var name = NameSplitter.SplitFullName(update.FullName);
        teacher.Twitter = update.Twitter;
        teacher.Location = update.Location;
        teacher.FirstName = name[0];
        teacher.SecondName = name[1];
        teacher.ThirdName = name[2];
        teacher.LastName = name[3];

        teacher.Specialty = update.Specialty;
        teacher.Mobile = update.Mobile;
        teacher.Location = update.Location;
        teacher.Bio = update.Bio;
        teacher.Facebook = update.Facebook;
        teacher.Twitter = update.Twitter;
        teacher.Instagram = update.Instagram;

        context.Teachers.Update(teacher);
        context.SaveChanges();
    }
}

