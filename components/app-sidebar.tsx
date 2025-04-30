"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChartIcon, CircleUserRoundIcon, HomeIcon, ListTodoIcon, MessageCircleIcon, PanelLeftIcon, SettingsIcon, UsersRoundIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useSidebar } from "@/components/ui/sidebar"

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === "collapsed"
  const pathname = usePathname()

  const navItems = [
    {
      title: "Home",
      href: "/",
      icon: HomeIcon,
      variant: "ghost",
    },
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: BarChartIcon,
      variant: "ghost",
    },
    {
      title: "Contacts",
      href: "/contacts",
      icon: UsersRoundIcon,
      variant: "ghost",
    },
    {
      title: "Messages",
      href: "/messages",
      icon: MessageCircleIcon,
      variant: "ghost",
    },
    {
      title: "Configuration",
      href: "/configuration",
      icon: SettingsIcon,
      variant: "ghost",
    },
  ]

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <Button
          variant="outline"
          size="icon"
          className="ml-auto"
          onClick={toggleSidebar}
        >
          <PanelLeftIcon className={cn("h-4 w-4", collapsed && "rotate-180")} />
        </Button>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          {navItems.map((item, index) => (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  passHref
                  className={cn(
                    "hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-lg px-2 py-2",
                    pathname === item.href && "bg-accent",
                    collapsed && "justify-center"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.title}</span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className={cn(!collapsed && "hidden")}>
                {item.title}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>
      </div>
      <div className="border-t p-2">
        <Link
          href="/profile"
          passHref
          className={cn(
            "hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-lg px-2 py-2",
            pathname === "/profile" && "bg-accent",
            collapsed && "justify-center"
          )}
        >
          <CircleUserRoundIcon className="h-5 w-5" />
          {!collapsed && (
            <span className="text-sm font-medium">Profile</span>
          )}
        </Link>
      </div>
    </aside>
  )
}
