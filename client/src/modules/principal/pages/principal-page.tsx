import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

function PrincipalPage() {
  return (
    <main className="min-h-screen bg-background p-4 lg:p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Principal Portal</h1>
        <p className="text-sm text-muted-foreground">Academic management modules will appear here.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Academic Management</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Principal-specific class, teacher, student, and subject tools are not connected yet.
        </CardContent>
      </Card>
    </main>
  )
}

export { PrincipalPage }
