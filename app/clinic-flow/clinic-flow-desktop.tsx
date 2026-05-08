"use client";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import type { Appointment } from "./types";

import { AmbientListenProvider } from "./ambient-listen-context";
import { AppointmentMasterList } from "./appointment-master-list";
import { CLINIC_FLOW_PAGE_TITLE } from "./clinic-flow-page-title";
import { IntakeSection } from "./intake-section";
import { PrevisitSection } from "./previsit-section";
import { RoomingSection } from "./rooming-section";
import { CareManagementSection } from "./care-management-section";
import { WrapUpSection } from "./wrap-up-section";
import { LabsSection } from "./labs-section";
import { VisitSection } from "./visit-section";
import { WorkspaceHuddleCard } from "./workspace-huddle-card";
import { WorkspacePinnedHeader } from "./workspace-pinned-header";
import { ScheduleToolbar, type ScheduleToolbarProps } from "./schedule-toolbar";

export type ClinicFlowDesktopProps = {
  isSidebarVisible: boolean;
  onToggleSidebarVisible: () => void;
  appointmentsForGrid: readonly Appointment[];
  selectedId: string;
  onSelectId: (id: string) => void;
  selectedDate: Date;
  onShiftDay: (deltaDays: number) => void;
  onGoToday: () => void;
  selectedAppointment: Appointment | null;
  onUpdateAppointment: (id: string, patch: Partial<Appointment>) => void;
  scheduleToolbarProps: ScheduleToolbarProps;
  /** Merged onto the root wrapper (layout visibility from `useClinicFlowShellLayout`). */
  className?: string;
};

export function ClinicFlowDesktop({
  isSidebarVisible,
  onToggleSidebarVisible,
  appointmentsForGrid,
  selectedId,
  onSelectId,
  selectedDate,
  onShiftDay,
  onGoToday,
  selectedAppointment,
  onUpdateAppointment,
  scheduleToolbarProps,
  className,
}: ClinicFlowDesktopProps) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1 flex-col overflow-hidden",
        className,
      )}
    >
      <div className="sticky top-0 z-20 shrink-0 border-b border-border/50 bg-background">
        <div
          className={cn(
            "pt-3 md:pt-4",
            !isSidebarVisible &&
              "mx-auto w-full max-w-6xl min-w-0 px-4 md:px-8",
          )}
        >
          <div className="pb-2">
            <div
              className={cn(
                "flex w-full min-w-0 items-center justify-between gap-3",
                isSidebarVisible && "px-4 md:px-6",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-2.5">
                <SidebarTrigger className="shrink-0" />
                <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight">
                  {CLINIC_FLOW_PAGE_TITLE}
                </h1>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-border/50"
                aria-pressed={!isSidebarVisible}
                onClick={onToggleSidebarVisible}
              >
                {isSidebarVisible ? "Hide schedule" : "Show schedule"}
              </Button>
            </div>
          </div>
          <ScheduleToolbar
            {...scheduleToolbarProps}
            insetWithWorkspace={!isSidebarVisible}
          />
        </div>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <aside
          className={cn(
            "flex min-h-0 flex-col overflow-hidden bg-background transition-[flex-basis,width,padding] duration-300 ease-out motion-reduce:transition-none",
            isSidebarVisible
              ? "min-w-0 basis-[40%] shrink-0 grow-0 border-r border-border/50"
              : "w-0 min-w-0 basis-0 shrink-0 grow-0 overflow-hidden border-0 p-0",
          )}
          aria-hidden={!isSidebarVisible}
        >
          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
            <AppointmentMasterList
              appointments={appointmentsForGrid}
              selectedId={selectedId}
              onSelectId={onSelectId}
              selectedDate={selectedDate}
              onShiftDay={onShiftDay}
              onGoToday={onGoToday}
              className="min-h-0 w-full min-w-0 flex-1"
            />
          </div>
        </aside>

        <main
          className={cn(
            "flex min-h-0 min-w-0 flex-col overflow-hidden bg-background transition-[flex-basis] duration-300 ease-out motion-reduce:transition-none",
            isSidebarVisible
              ? "basis-[60%] shrink-0 grow-0"
              : "min-w-0 flex-1 basis-auto",
          )}
        >
          {selectedAppointment ? (
            <AmbientListenProvider key={selectedAppointment.id}>
              <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
                <WorkspacePinnedHeader
                  appointment={selectedAppointment}
                  onStageChange={(stage) =>
                    onUpdateAppointment(selectedAppointment.id, { stage })
                  }
                  onRoomChange={(room) =>
                    onUpdateAppointment(selectedAppointment.id, { room })
                  }
                  className="shrink-0"
                />
                <div
                  className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-background pb-4"
                  aria-label="Workspace"
                >
                  <div className="mx-auto w-full max-w-6xl min-w-0 px-8">
                    <div className="h-[280px] md:hidden" aria-hidden />
                    <div className="hidden h-6 md:block" aria-hidden />
                    <div className="hidden md:flex md:flex-col md:gap-6">
                      <WorkspaceHuddleCard
                        key={selectedAppointment.id}
                        appointment={selectedAppointment}
                        layout="desktop"
                      />
                      <PrevisitSection
                        key={`${selectedAppointment.id}-previsit`}
                        appointment={selectedAppointment}
                        layout="desktop"
                      />
                      <IntakeSection
                        key={`${selectedAppointment.id}-intake`}
                        appointment={selectedAppointment}
                        layout="desktop"
                      />
                      <RoomingSection
                        key={`${selectedAppointment.id}-rooming`}
                        appointment={selectedAppointment}
                        layout="desktop"
                      />
                      <VisitSection
                        key={`${selectedAppointment.id}-visit`}
                        appointment={selectedAppointment}
                        layout="desktop"
                      />
                      <LabsSection
                        key={`${selectedAppointment.id}-labs`}
                        appointment={selectedAppointment}
                        layout="desktop"
                      />
                      <CareManagementSection
                        key={`${selectedAppointment.id}-care-management`}
                        appointment={selectedAppointment}
                        layout="desktop"
                      />
                      <WrapUpSection
                        key={`${selectedAppointment.id}-wrap-up`}
                        appointment={selectedAppointment}
                        layout="desktop"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </AmbientListenProvider>
          ) : (
            <div
              className={cn(
                "min-h-0 min-w-0 flex-1 overflow-y-auto p-6",
                textMeta,
                !isSidebarVisible && "mx-auto w-full max-w-6xl px-8",
              )}
            >
              No appointment selected.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
