using Microsoft.EntityFrameworkCore;
using SchoolSystemTask.Models;

namespace SchoolSystemTask.Repositories;

public class AssignmentSubmissionRepository(MyDbContext context)
{
    public int SubmissionsCount(int teacherId)
    {
        return context.AssignmentSubmissions.
        Include(a => a.Assignment.ClassSubject.
        TeacherSubject).
        Where(a => a.Assignment.ClassSubject.TeacherSubject.TeacherId == teacherId).
        Count();
    }
}