import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

function ParentPage() {
  return (
    <main className="min-h-screen bg-background p-4 lg:p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Parent Portal</h1>
        <p className="text-sm text-muted-foreground">Linked child academic information will appear here.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Family Access</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Parent-specific child selection, classes, exams, and results are not connected yet.
        </CardContent>
      </Card>
    </main>
  )
}

export { ParentPage }
