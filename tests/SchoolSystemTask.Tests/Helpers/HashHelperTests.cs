using SchoolSystemTask.Helpers;

namespace SchoolSystemTask.Tests.Helpers;

public class HashHelperTests
{
    [Fact]
    public void HashPassword_ReturnsStableSha256HexValue()
    {
        var first = HashHelper.HashPassword("secret-password", "fixed-salt");
        var second = HashHelper.HashPassword("secret-password", "fixed-salt");

        Assert.Equal(first, second);
        Assert.Equal(64, first.Length);
        Assert.Matches("^[a-f0-9]{64}$", first);
    }

    [Fact]
    public void HashPassword_ChangesWhenSaltChanges()
    {
        var first = HashHelper.HashPassword("secret-password", "salt-one");
        var second = HashHelper.HashPassword("secret-password", "salt-two");

        Assert.NotEqual(first, second);
    }
}
