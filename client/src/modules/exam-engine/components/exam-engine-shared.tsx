import { CheckCircle2, Eye, LayoutDashboard } from "lucide-react"

import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { cn } from "@/shared/lib/utils"

const statusTone: Record<string, string> = {
  Active: "border-primary/30 bg-primary/10 text-primary",
  Draft: "border-border bg-muted text-muted-foreground",
  Scheduled: "border-accent bg-accent text-accent-foreground",
  Completed: "border-secondary bg-secondary text-secondary-foreground",
  Archived: "border-border bg-card text-muted-foreground",
}

export function SideButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: typeof LayoutDashboard
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        "mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
        active && "border-l-4 border-primary bg-secondary text-secondary-foreground",
      )}
      type="button"
      onClick={onClick}
    >
      <Icon className="size-4" />
      {label}
    </button>
  )
}

export function PanelCrashFallback() {
  return (
    <div className="m-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive lg:m-6">
      <div className="font-medium">This exam section crashed while rendering.</div>
      <p className="mt-1 text-destructive/90">The rest of the app is still available. Refresh after fixing the data or API response.</p>
    </div>
  )
}

export function ApiUnavailable() {
  return (
    <div className="flex-1 p-4 lg:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Exam API is not running</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>The frontend is loaded, but `/api` requests are failing. Start the ASP.NET API, then refresh this page.</p>
          <p>The exam engine no longer uses frontend fallback data. Start the ASP.NET API with a migrated database, then refresh this page.</p>
        </CardContent>
      </Card>
    </div>
  )
}

export function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  )
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge className={cn("border", statusTone[status])} variant="outline">{status}</Badge>
}

export function IconButton({ icon: Icon, onClick, title }: { icon: typeof Eye; onClick?: () => void; title: string }) {
  return (
    <Button title={title} variant="ghost" size="icon" onClick={onClick}>
      <Icon className="size-4" />
    </Button>
  )
}

export function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b pb-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

export function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border p-2">
      <CheckCircle2 className={cn("size-4", done ? "text-primary" : "text-muted-foreground")} />
      <span>{label}</span>
    </div>
  )
}
