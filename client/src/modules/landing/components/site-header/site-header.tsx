import { GraduationCap } from "lucide-react"
import { Link } from "@tanstack/react-router"

import { Button } from "@/shared/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/shared/components/ui/navigation-menu"

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-2 font-semibold tracking-normal" to="/">
          <GraduationCap className="size-5 text-primary" aria-hidden="true" />
          EduManager
        </Link>

        <NavigationMenu className="hidden md:flex" viewport={false}>
          <NavigationMenuList className="gap-8">
            {["Features", "Pricing", "Contact"].map((item) => (
              <NavigationMenuItem key={item}>
                <NavigationMenuLink
                  className="p-0 text-sm font-normal text-muted-foreground hover:bg-transparent hover:text-foreground focus:bg-transparent"
                  href={item === "Contact" ? "#contact" : `#${item.toLowerCase()}`}
                >
                  {item}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          <Button asChild className="hidden text-primary sm:inline-flex" variant="ghost">
            <Link to="/login">Log In</Link>
          </Button>
          <Button asChild className="px-4">
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

export { SiteHeader }
