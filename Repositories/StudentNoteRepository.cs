using System.Net;
using Microsoft.EntityFrameworkCore;
using PayPal;
using SchoolSystemTask.DTOs.StudentNoteDTOs;
using SchoolSystemTask.Models;
using SchoolSystemTask.Models.StaticData;

namespace SchoolSystemTask.Repositories;
public class StudentNoteRepository(MyDbContext context)
{
    public List<StudentNote> GetTeacherStudentNotes(int teacherId)
    {
        return [.. context.StudentNotes.Where(s => s.TeacherId == teacherId).Include(sn => sn.NoteType)
            .Include(s => s.Student.Class.ClassSubjects)
            .ThenInclude(classSubject => classSubject.TeacherSubject.Subject)];
    }

    public List<StudentNote> GetStudentNotes(int studentId)
    {
        return context.StudentNotes.Where(s => s.StudentId == studentId).ToList();
    }

    public StudentNote AddStudentNote(CreateStudentNoteDto newNote, int teacherId)
    {

        var studentNote = new StudentNote
        {
            Note = newNote.Note,
            NoteTypeId = newNote.NoteTypeId,
            StudentId = newNote.StudentId,
            TeacherId = teacherId
        };
        context.StudentNotes.Add(studentNote);
        context.ActionHistories.Add(new ActionHistory
        {
            Name = ActionNames.CreateStudentNote,
            Description = "Added a new student note.",
            UserId = context.UserTeachers.First(u => u.TeacherId == teacherId).UserTeacherId
        });
        context.SaveChanges();
        return studentNote;
    }

    public void DeleteTeacherStudentNote(int id, int teacherId)
    {
        var studentNote = context.StudentNotes.Find(id);
        if (studentNote == null)
            return;

        studentNote.TeacherId = teacherId;
        context.StudentNotes.Remove(studentNote);
        context.ActionHistories.Add(new ActionHistory
        {
            Name = ActionNames.DeleteStudentNote,
            Description = "Deleted a student note.",
            UserId = context.UserTeachers.First(u => u.TeacherId == teacherId).UserTeacherId
        });
        context.SaveChanges();
    }

    public StudentNote? DeleteStudentNote(int id, int userId)
    {
        var studentNote = context.StudentNotes.Find(id);
        if (studentNote != null)
        {
            context.StudentNotes.Remove(studentNote);
            context.SaveChanges();
        }
        context.ActionHistories.Add(new ActionHistory
        {
            Name = ActionNames.DeleteStudentNote,
            Description = "Deleted a student note.",
            UserId = userId
        });
        return studentNote;
    }

    public List<NoteType> GetNoteTypes() => context.NoteTypes.ToList();

    internal StudentNote EditNote(EditStudentNoteDto editStudentNoteDto, int userId)
    {
        var note = context.StudentNotes.Find(editStudentNoteDto.StudentNoteId);
        if (note == null)
            throw new BadHttpRequestException("Couldn't find the student note with the given Id");
        note.NoteTypeId = editStudentNoteDto.NoteTypeId;
        note.Note = editStudentNoteDto.Note;
        context.StudentNotes.Update(note);
        context.ActionHistories.Add(new ActionHistory
        {
            Name = ActionNames.UpdateStudentNote,
            Description = "Updated a student note.",
            UserId = userId
        });
        context.SaveChanges();
        return note;
    }
}