using SchoolSystemTask.Models;

namespace SchoolSystemTask.Repositories;

public class ActionHistoryRepository(MyDbContext context)
{
    internal (int, List<ActionHistory>) GetLastTenActions(int userId)
    {
        var actions = context.ActionHistories.Where(a => a.UserId == userId).AsQueryable();
        return (actions.Count(), [.. actions.OrderByDescending(a => a.Date).Take(5)]);
    }
}