using SchoolSystemTask.Modules.Auth.Domain;

namespace SchoolSystemTask.Tests.Modules.Auth;

public class AuthRolesTests
{
    [Theory]
    [InlineData(AuthRoles.Admin)]
    [InlineData(AuthRoles.Principal)]
    [InlineData(AuthRoles.Teacher)]
    [InlineData(AuthRoles.Student)]
    [InlineData(AuthRoles.Parent)]
    [InlineData("ADMIN")]
    public void IsValid_AcceptsFoundationRoles(string role)
    {
        Assert.True(AuthRoles.IsValid(role));
    }

    [Theory]
    [InlineData("")]
    [InlineData("guardian")]
    [InlineData("super-admin")]
    public void IsValid_RejectsUnknownRoles(string role)
    {
        Assert.False(AuthRoles.IsValid(role));
    }

    [Fact]
    public void PublicRegistrationRole_IsStudent()
    {
        Assert.Equal(AuthRoles.Student, AuthRoles.PublicRegistrationRole);
    }
}
