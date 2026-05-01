"use client"

import Link from "next/link"
import {
  Activity,
  Calendar,
  Inbox,
  MessageSquare,
  Users,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const iconProps = { strokeWidth: 1.5 as const, className: "size-4 shrink-0" as const }

const nav = [
  { title: "Clinic Flow", href: "/clinic-flow", icon: Activity },
  { title: "Panel Management", href: "/panel-management", icon: Users },
  { title: "Booking", href: "/booking", icon: Calendar },
  { title: "Inbox", href: "/inbox", icon: Inbox },
  { title: "Messaging", href: "/messaging", icon: MessageSquare },
] as const

export function AppSidebar() {
  return (
    <Sidebar
      collapsible="offcanvas"
      variant="sidebar"
      className="border-r border-border/50 font-sans"
    >
      <SidebarHeader className="gap-1 p-2">
        <div className="px-2 text-sm font-semibold tracking-tight text-sidebar-foreground">
          Ontario
        </div>
      </SidebarHeader>
      <SidebarContent className="font-sans">
        <SidebarGroup className="p-1">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {nav.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild size="sm" tooltip={item.title}>
                      <Link href={item.href}>
                        <Icon {...iconProps} aria-hidden />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
