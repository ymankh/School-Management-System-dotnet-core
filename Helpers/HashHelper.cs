namespace SchoolSystemTask.Helpers;
using System.Security.Cryptography;
using System.Text;


public static class HashHelper
{
    public static string HashPassword(string password, string salt)
    {
        // Combine the password with the salt before hashing
        var saltedPassword = password + salt;
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(saltedPassword));
        var builder = new StringBuilder();
        foreach (var byteValue in bytes)
        {
            builder.Append(byteValue.ToString("x2"));
        }
        return builder.ToString();
    }
}


