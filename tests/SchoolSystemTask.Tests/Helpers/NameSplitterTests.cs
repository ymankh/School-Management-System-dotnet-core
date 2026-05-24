using SchoolSystemTask.Helpers;

namespace SchoolSystemTask.Tests.Helpers;

public class NameSplitterTests
{
    [Theory]
    [InlineData("Lina", "Lina", "", "", "")]
    [InlineData("Lina Haddad", "Lina", "", "", "Haddad")]
    [InlineData("Lina Sami Haddad", "Lina", "Sami", "", "Haddad")]
    [InlineData("Lina Sami Omar Haddad", "Lina", "Sami", "Omar", "Haddad")]
    [InlineData("Lina Sami Omar Ali Haddad", "Lina", "Sami", "Omar", "Haddad")]
    public void SplitFullName_ReturnsExpectedNameParts(
        string fullName,
        string firstName,
        string secondName,
        string thirdName,
        string lastName)
    {
        var result = NameSplitter.SplitFullName(fullName);

        Assert.Equal([firstName, secondName, thirdName, lastName], result);
    }
}
