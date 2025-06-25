using SchoolSystemTask.Models;
using SchoolSystemTask.Helpers;
using Microsoft.EntityFrameworkCore;

namespace SchoolSystemTask.Repositories;

public class UserRepository(MyDbContext context)
{
    public UserTeacher Register(Teacher teacher, string email, string password, string role)
    {
        // Generate a unique salt for this user
        var salt = SaltHelper.GenerateSalt(16); // 16 bytes salt

        // Hash the password with the salt
        var hashedPassword = HashHelper.HashPassword(password, salt);
        var user = new UserTeacher
        {
            TeacherId = teacher.Id,
            Email = email,
            PasswordHash = hashedPassword,
            Salt = salt,
            Role = role
        };

        context.UserTeachers.Add(user);
        context.SaveChanges();
        return user;
    }

    public UserStudent RegisterStudent(Student student)
    {
        // Generate a unique salt for this user
        var salt = SaltHelper.GenerateSalt(16); // 16 bytes salt

        var password = student.NationalId + salt;

        // Hash the password with the salt
        var hashedPassword = HashHelper.HashPassword(password, salt);
        var user = new UserStudent
        {
            Email = student.StudentDetails.Email,
            PasswordHash = hashedPassword,
            Salt = salt,
            StudentId = student.Id
        };

        context.UserStudents.Add(user);
        context.SaveChanges();
        return user;
    }

    public UserTeacher? GetUserByEmail(string email)
    {
        return context.UserTeachers.FirstOrDefault(u => u.Email == email);
    }

    public UserTeacher? GetUserByEmailAndPassword(string email, string password)
    {
        var user = context.UserTeachers.SingleOrDefault(u => u.Email == email);
        if (user == null)
        {
            return null;
        }

        var hashedPassword = HashHelper.HashPassword(password, user.Salt);

        return user.PasswordHash == hashedPassword ? user : null;
    }

    internal UserTeacher? GetUserById(int id)
    {
        return context.UserTeachers.Include(u => u.Teacher).First(u => u.UserTeacherId == id);
    }
}