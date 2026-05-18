"use client"

import { usePathname } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { cn } from "@/lib/utils"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const clinicFlowRoute = pathname?.startsWith("/clinic-flow") ?? false
  const messagingRoute = pathname?.startsWith("/messaging") ?? false
  const inboxRoute = pathname?.startsWith("/inbox") ?? false
  const panelManagementRoute =
    pathname?.startsWith("/panel-management") ?? false
  const bookingRoute = pathname?.startsWith("/booking") ?? false
  const fullBleedAppRoute =
    clinicFlowRoute ||
    messagingRoute ||
    inboxRoute ||
    panelManagementRoute ||
    bookingRoute

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset
        className={cn(
          "flex flex-1 flex-col font-sans max-md:overflow-visible",
          fullBleedAppRoute
            ? "min-h-0 max-md:min-h-svh md:h-svh md:max-h-svh"
            : "min-h-svh",
        )}
      >
        <header
          className={cn(
            "flex h-12 shrink-0 items-center gap-2 border-b border-border/60 bg-background px-3 max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:z-100 md:sticky md:top-0 md:z-100 md:backdrop-blur-sm",
            /* Clinic Flow renders its own trigger + title in-page (mobile + desktop). */
            fullBleedAppRoute && "hidden",
          )}
        >
          <SidebarTrigger />
        </header>
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-visible max-md:min-h-min max-md:flex-none max-md:overflow-visible",
            fullBleedAppRoute && "md:overflow-hidden",
          )}
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
