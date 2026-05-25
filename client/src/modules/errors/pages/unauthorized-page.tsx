import { Link } from "@tanstack/react-router"

import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Unauthorized</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>You do not have permission to access this page.</p>
          <Button asChild>
            <Link to="/exam">Go To My Portal</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}

export { UnauthorizedPage }
