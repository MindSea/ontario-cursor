"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { Appointment } from "./types";

import { AppointmentMasterList } from "./appointment-master-list";
import { ScheduleDateRow } from "./schedule-date-row";
import { WorkspaceHuddleCard } from "./workspace-huddle-card";
import { WorkspacePinnedHeader } from "./workspace-pinned-header";

/** Mobile schedule + workspace tab panels: shared flex scroll contract (keep in sync). */
const MOBILE_TAB_PANEL_SCROLL_CLASS =
  "flex h-full min-h-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto p-0 outline-none focus-visible:ring-0 data-[state=inactive]:hidden";

function parseMobileTab(value: string): "schedule" | "workspace" {
  return value === "workspace" ? "workspace" : "schedule";
}

export type ClinicFlowMobileProps = {
  mobileTab: "schedule" | "workspace";
  onMobileTabChange: (tab: "schedule" | "workspace") => void;
  selectedDate: Date;
  onShiftDay: (delta: number) => void;
  onGoToday: () => void;
  selectedAppointment: Appointment | null;
  appointmentsForGrid: readonly Appointment[];
  selectedId: string;
  onSelectId: (id: string) => void;
  onSwitchToWorkspaceTab: () => void;
  onUpdateAppointment: (id: string, patch: Partial<Appointment>) => void;
};

export function ClinicFlowMobile({
  mobileTab,
  onMobileTabChange,
  selectedDate,
  onShiftDay,
  onGoToday,
  selectedAppointment,
  appointmentsForGrid,
  selectedId,
  onSelectId,
  onSwitchToWorkspaceTab,
  onUpdateAppointment,
}: ClinicFlowMobileProps) {
  return (
    <div className="fixed inset-0 z-0 flex h-dvh min-h-0 w-full min-w-full flex-col overflow-x-hidden p-0 md:hidden">
      <Tabs
        value={mobileTab}
        onValueChange={(v) => onMobileTabChange(parseMobileTab(v))}
        className="flex h-full min-h-0 w-full min-w-full flex-1 flex-col overflow-x-hidden p-0"
      >
        <div className="fixed inset-x-0 top-0 z-100 flex w-full min-w-full flex-col bg-background p-0 md:hidden">
          <div className="flex h-12 w-full shrink-0 items-center gap-2 border-b border-border/60 bg-background px-4">
            <SidebarTrigger />
          </div>
          <TabsList
            variant="line"
            className="grid min-h-11 w-full max-w-[100vw] shrink-0 grid-cols-2 gap-0 rounded-none border-0 border-b border-border/60 bg-background px-4 py-1.5 overflow-x-hidden"
          >
            <TabsTrigger
              value="schedule"
              className="min-w-0 w-full overflow-hidden text-center text-sm font-medium"
            >
              Schedule
            </TabsTrigger>
            <TabsTrigger
              value="workspace"
              className="min-w-0 w-full overflow-hidden text-center text-sm font-medium"
            >
              Workspace
            </TabsTrigger>
          </TabsList>
          {mobileTab === "schedule" ? (
            <ScheduleDateRow
              selectedDate={selectedDate}
              onShiftDay={onShiftDay}
              onGoToday={onGoToday}
              fullBleed
              className="w-full shrink-0 border-x-0 border-t border-b border-border/40 bg-background px-4"
            />
          ) : null}
          {mobileTab === "workspace" && selectedAppointment ? (
            <div className="w-full min-w-full shrink-0 overflow-x-hidden bg-background p-0">
              <WorkspacePinnedHeader
                appointment={selectedAppointment}
                onStageChange={(stage) =>
                  onUpdateAppointment(selectedAppointment.id, { stage })
                }
                onRoomChange={(room) =>
                  onUpdateAppointment(selectedAppointment.id, { room })
                }
                className="w-full min-w-full border-0 border-b border-t border-border/60 bg-background shadow-none"
              />
            </div>
          ) : null}
        </div>

        <div className="flex h-full min-h-0 w-full min-w-full flex-1 flex-col overflow-x-hidden overscroll-contain p-0">
          <TabsContent value="schedule" className={MOBILE_TAB_PANEL_SCROLL_CLASS}>
            {/* Offset for fixed nav + tabs + date row (must match sticky stack height). */}
            <div
              className="block h-[144px] w-full shrink-0"
              aria-hidden="true"
            />
            <AppointmentMasterList
              appointments={appointmentsForGrid}
              selectedId={selectedId}
              onSelectId={(id) => {
                onSelectId(id);
                onSwitchToWorkspaceTab();
              }}
              selectedDate={selectedDate}
              onShiftDay={onShiftDay}
              onGoToday={onGoToday}
              fullBleed
              hideDateRow
              className="w-full"
            />
          </TabsContent>
          <TabsContent
            value="workspace"
            aria-label="Workspace"
            className={MOBILE_TAB_PANEL_SCROLL_CLASS}
          >
            {selectedAppointment ? (
              <>
                {/* Offset for fixed nav + tabs + patient header. */}
                <div
                  className="block h-[300px] w-full shrink-0"
                  aria-hidden="true"
                />
                {/* Side gutters + bottom margin above browser chrome. */}
                <div className="mb-32 block w-full px-4">
                  <WorkspaceHuddleCard
                    key={selectedAppointment.id}
                    appointment={selectedAppointment}
                    layout="mobile"
                  />
                </div>
                {/* Ensures scroll overflow on short content (Safari); remove when tasks always fill. */}
                <div
                  className="h-[50vh] w-full shrink-0"
                  aria-hidden="true"
                />
              </>
            ) : (
              <p className="px-4 pb-8 text-sm text-muted-foreground">
                No appointment selected.
              </p>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
