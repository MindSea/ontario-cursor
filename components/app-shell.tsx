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

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset
        className={cn(
          "flex flex-1 flex-col font-sans max-md:overflow-visible",
          clinicFlowRoute
            ? "min-h-0 max-md:min-h-svh md:h-svh md:max-h-svh"
            : "min-h-svh",
        )}
      >
        <header
          className={cn(
            "flex h-12 shrink-0 items-center gap-2 border-b border-border/60 bg-background px-3 max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:z-100 md:sticky md:top-0 md:z-100 md:backdrop-blur-sm",
            clinicFlowRoute && "max-md:hidden",
          )}
        >
          <SidebarTrigger />
        </header>
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-visible max-md:min-h-min max-md:flex-none max-md:overflow-visible",
            clinicFlowRoute && "md:overflow-hidden",
          )}
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
