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
  const clinicFlowMobileHeader = pathname?.startsWith("/clinic-flow") ?? false

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-h-svh font-sans max-md:overflow-visible">
        <header
          className={cn(
            "flex h-12 shrink-0 items-center gap-2 border-b border-border/60 bg-background px-3 max-md:fixed max-md:inset-x-0 max-md:top-0 max-md:z-100 md:sticky md:top-0 md:z-100 md:backdrop-blur-sm",
            clinicFlowMobileHeader && "max-md:hidden",
          )}
        >
          <SidebarTrigger />
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-visible max-md:min-h-min max-md:flex-none max-md:overflow-visible">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
