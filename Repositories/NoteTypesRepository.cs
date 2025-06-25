using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SchoolSystemTask.Models;

namespace SchoolSystemTask.Repositories;

public class NoteTypesRepository(MyDbContext context)
{
    public IEnumerable<NoteType> GetNoteTypes()
    {
        return context.NoteTypes.ToList();
    }
}