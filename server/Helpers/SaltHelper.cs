namespace SchoolSystemTask.Helpers;

using System.Security.Cryptography;

public static class SaltHelper
{
    public static string GenerateSalt(int size)
    {
        var salt = new byte[size];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(salt);
        }
        return Convert.ToBase64String(salt);
    }
}

