namespace SchoolSystemTask.Helpers;

public static class NameSplitter
{
    public static string[] SplitFullName(string fullName)
    {
        var nameParts = fullName.Split(' ');

        var firstName = "";
        var secondName = "";
        var thirdName = "";
        var lastName = "";

        switch (nameParts.Length)
        {
            case 1:
                firstName = nameParts[0];
                break;
            case 2:
                firstName = nameParts[0];
                lastName = nameParts[1];
                break;
            case 3:
                firstName = nameParts[0];
                secondName = nameParts[1];
                lastName = nameParts[2];
                break;
            case >= 4:
                firstName = nameParts[0];
                secondName = nameParts[1];
                thirdName = nameParts[2];
                lastName = nameParts[^1];
                break;
        }

        return [firstName, secondName, thirdName, lastName];
    }
}
