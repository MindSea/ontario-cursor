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
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const iconProps = { strokeWidth: 1.5 as const, className: "size-5 shrink-0" as const }

const nav = [
  { title: "Clinic Flow", href: "/clinic-flow", icon: Activity },
  { title: "Panel Management", href: "/panel-management", icon: Users },
  { title: "Booking", href: "/booking", icon: Calendar },
  { title: "Inbox", href: "/inbox", icon: Inbox },
  { title: "Messaging", href: "/messaging", icon: MessageSquare },
] as const

export function AppSidebar() {
  const { isMobile, state } = useSidebar()
  const collapsedDesktopRail = !isMobile && state === "collapsed"

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="border-r border-border/50 font-sans"
    >
      <SidebarHeader
        className={cn(
          "gap-1 p-2",
          collapsedDesktopRail && "flex justify-center px-1 py-2",
        )}
      >
        <Link
          href="/clinic-flow"
          className={cn(
            "block rounded-md outline-none ring-sidebar-ring focus-visible:ring-2",
            collapsedDesktopRail
              ? "flex items-center justify-center p-0"
              : "px-2 py-1",
          )}
        >
          <img
            src={
              collapsedDesktopRail
                ? "/brand/tsh-logo-mark.svg"
                : "/brand/tsh-logo-lightbg-horizontal-2color.svg"
            }
            alt="Toronto Seniors Housing"
            width={collapsedDesktopRail ? 141 : 686}
            height={140}
            className={cn(
              "object-contain",
              collapsedDesktopRail
                ? "size-8"
                : "h-14 w-auto max-w-full object-left",
            )}
            decoding="async"
          />
        </Link>
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
