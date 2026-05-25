import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

function AdminPage() {
  return (
    <main className="min-h-screen bg-background p-4 lg:p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Admin Portal</h1>
        <p className="text-sm text-muted-foreground">System administration modules will appear here.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Administration</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          User, role, subject, class, enrollment, and assignment tools are not connected yet.
        </CardContent>
      </Card>
    </main>
  )
}

export { AdminPage }
