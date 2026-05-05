"use client";

import { Button } from "@/components/ui/button";
import { textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import type { Appointment } from "./types";

import { AppointmentMasterList } from "./appointment-master-list";
import { IntakeSection } from "./intake-section";
import { PrevisitSection } from "./previsit-section";
import { WorkspaceHuddleCard } from "./workspace-huddle-card";
import { WorkspacePinnedHeader } from "./workspace-pinned-header";

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
}: ClinicFlowDesktopProps) {
  return (
    <div className="hidden min-h-0 flex-1 flex-col overflow-hidden md:flex">
      <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 border-b border-border/50 bg-background px-4 py-2">
        <h1 className="text-lg font-semibold tracking-tight">Clinic Flow</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-border/50"
          aria-pressed={!isSidebarVisible}
          onClick={onToggleSidebarVisible}
        >
          {isSidebarVisible ? "Privacy mode" : "Show master list"}
        </Button>
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
                className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain bg-background px-8 pb-4"
                aria-label="Workspace"
              >
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
                </div>
              </div>
            </div>
          ) : (
            <div className={cn("min-h-0 min-w-0 flex-1 overflow-y-auto p-6", textMeta)}>
              No appointment selected.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
