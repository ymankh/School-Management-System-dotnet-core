import type { ReactNode } from "react"
import { GraduationCap, LogOut, UserRound, type LucideIcon } from "lucide-react"

import type { AuthUser } from "@/modules/auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/shared/components/ui/sidebar"
import { TooltipProvider } from "@/shared/components/ui/tooltip"

export type DashboardNavItem = {
  active: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
}

export type DashboardPageItem = {
  content: ReactNode
  icon: LucideIcon
  id: string
  label: string
}

type DashboardShellProps = {
  activePage?: string
  children?: ReactNode
  contentClassName?: string
  currentUser?: AuthUser
  description?: string
  navItems?: DashboardNavItem[]
  onPageChange?: (page: string) => void
  onLogout?: () => void
  pages?: DashboardPageItem[]
  sectionLabel?: string
  title: string
}

function DashboardShell({
  activePage,
  children,
  contentClassName,
  currentUser,
  description,
  navItems,
  onPageChange,
  onLogout,
  pages,
  sectionLabel = "Dashboard",
  title,
}: DashboardShellProps) {
  const activeDashboardPage = pages?.find((page) => page.id === activePage) ?? pages?.[0]
  const content = activeDashboardPage?.content ?? children
  const navigationItems = navItems ?? pages?.map((page) => ({
    active: activeDashboardPage?.id === page.id,
    icon: page.icon,
    label: page.label,
    onClick: () => onPageChange?.(page.id),
  })) ?? []

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={false}>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" tooltip="EduManager">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                    <GraduationCap className="size-4" aria-hidden="true" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">EduManager</span>
                    <span className="truncate text-xs uppercase text-sidebar-foreground/70">{sectionLabel}</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarTrigger className="ml-auto" />
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => {
                    const Icon = item.icon

                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton isActive={item.active} tooltip={item.label} onClick={item.onClick}>
                          <Icon className="size-4" aria-hidden="true" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {currentUser && (
            <SidebarFooter>
              <SidebarSeparator />
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" tooltip={currentUser.fullName}>
                    <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
                      <UserRound className="size-4" aria-hidden="true" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{currentUser.fullName}</span>
                      <span className="truncate text-xs capitalize text-sidebar-foreground/70">{currentUser.role}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {onLogout && (
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Log Out" onClick={onLogout}>
                      <LogOut className="size-4" aria-hidden="true" />
                      <span>Log Out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarFooter>
          )}

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-10 flex min-h-16 items-center border-b bg-card px-4 py-3 lg:px-6">
            <div>
              <h1 className="text-lg font-semibold">{title}</h1>
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          </header>
          {contentClassName ? <div className={contentClassName}>{content}</div> : content}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}

export { DashboardShell }
