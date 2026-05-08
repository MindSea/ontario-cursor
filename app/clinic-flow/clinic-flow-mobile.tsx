"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import type { Appointment } from "./types";

import { AmbientListenProvider } from "./ambient-listen-context";
import { AppointmentMasterList } from "./appointment-master-list";
import { DayAgendaList } from "./day-agenda-list";
import { CLINIC_FLOW_PAGE_TITLE } from "./clinic-flow-page-title";
import type { FilteredMatchDayOption } from "./schedule-date-row";
import { ScheduleDateRow } from "./schedule-date-row";
import { IntakeSection } from "./intake-section";
import { RoomingSection } from "./rooming-section";
import { CareManagementSection } from "./care-management-section";
import { WrapUpSection } from "./wrap-up-section";
import { LabsSection } from "./labs-section";
import { VisitSection } from "./visit-section";
import { PrevisitSection } from "./previsit-section";
import { WorkspaceHuddleCard } from "./workspace-huddle-card";
import { WorkspacePinnedHeader } from "./workspace-pinned-header";
import {
  ScheduleViewToggle,
  type ScheduleViewMode,
} from "./schedule-view-toggle";
import { ScheduleToolbar, type ScheduleToolbarProps } from "./schedule-toolbar";

/** Mobile schedule + workspace tab panels: scroll inside each tab; chrome sits in-flow above (no spacer). */
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
  scheduleToolbarProps: ScheduleToolbarProps;
  scheduleViewMode: ScheduleViewMode;
  onScheduleViewModeChange: (mode: ScheduleViewMode) => void;
  filteredMatchDayOptions: readonly FilteredMatchDayOption[];
  onSelectFilteredCalendarDay: (dateKey: string) => void;
  /** Merged onto the root wrapper (layout visibility from `useClinicFlowShellLayout`). */
  className?: string;
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
  scheduleToolbarProps,
  scheduleViewMode,
  onScheduleViewModeChange,
  filteredMatchDayOptions,
  onSelectFilteredCalendarDay,
  className,
}: ClinicFlowMobileProps) {
  return (
    <div
      className={cn(
        "z-0 flex min-h-0 w-full min-w-full flex-col overflow-x-hidden p-0",
        "max-md:fixed max-md:inset-0 max-md:h-dvh",
        "md:absolute md:inset-0 md:min-h-0 md:h-full",
        className,
      )}
    >
      <Tabs
        value={mobileTab}
        onValueChange={(v) => onMobileTabChange(parseMobileTab(v))}
        className="flex h-full min-h-0 w-full min-w-full flex-1 flex-col overflow-x-hidden p-0"
      >
        <div className="relative z-100 flex w-full min-w-full shrink-0 flex-col bg-background p-0">
          <div
            className={cn(
              "flex h-12 w-full min-w-0 shrink-0 items-center gap-2 border-b border-border/60 bg-background px-4",
              textBody,
            )}
          >
            <SidebarTrigger className="shrink-0" />
            <h1 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight">
              {CLINIC_FLOW_PAGE_TITLE}
            </h1>
          </div>
          <TabsList
            variant="line"
            className="grid min-h-11 w-full max-w-[100vw] shrink-0 grid-cols-2 gap-0 rounded-none border-0 border-b border-border/60 bg-background px-4 py-1.5 overflow-x-hidden"
          >
            <TabsTrigger
              value="schedule"
              className={cn(
                "min-w-0 w-full overflow-hidden text-center font-medium",
                textBody,
              )}
            >
              Schedule
            </TabsTrigger>
            <TabsTrigger
              value="workspace"
              className={cn(
                "min-w-0 w-full overflow-hidden text-center font-medium",
                textBody,
              )}
            >
              Workspace
            </TabsTrigger>
          </TabsList>
          {mobileTab === "schedule" ? (
            <>
              <ScheduleToolbar {...scheduleToolbarProps} layout="panel" />
              <ScheduleDateRow
                selectedDate={selectedDate}
                onShiftDay={onShiftDay}
                onGoToday={onGoToday}
                fullBleed
                className="w-full shrink-0 border-x-0 border-t border-b border-border/40 px-4"
                filteredMatchDayOptions={filteredMatchDayOptions}
                onSelectFilteredCalendarDay={onSelectFilteredCalendarDay}
              />
              <div className="flex w-full shrink-0 border-b border-border/40 px-1 py-1">
                <ScheduleViewToggle
                  value={scheduleViewMode}
                  onChange={onScheduleViewModeChange}
                  compact
                  className="w-full"
                />
              </div>
            </>
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

        <div className="flex min-h-0 w-full min-w-full flex-1 flex-col overflow-x-hidden overscroll-contain p-0">
          <TabsContent value="schedule" className={MOBILE_TAB_PANEL_SCROLL_CLASS}>
            <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
              {scheduleViewMode === "grid" ? (
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
                  className="min-h-0 w-full min-w-0 flex-1"
                />
              ) : (
                <DayAgendaList
                  appointments={appointmentsForGrid}
                  selectedId={selectedId}
                  onSelectId={(id) => {
                    onSelectId(id);
                    onSwitchToWorkspaceTab();
                  }}
                  selectedDate={selectedDate}
                  onShiftDay={onShiftDay}
                  onGoToday={onGoToday}
                  onUpdateAppointment={onUpdateAppointment}
                  fullBleed
                  hideDateRow
                  className="min-h-0 w-full min-w-0 flex-1"
                />
              )}
            </div>
          </TabsContent>
          <TabsContent
            value="workspace"
            aria-label="Workspace"
            className={MOBILE_TAB_PANEL_SCROLL_CLASS}
          >
            {selectedAppointment ? (
              <AmbientListenProvider key={selectedAppointment.id}>
                <>
                  {/* Side gutters, air below sticky patient header, bottom margin above browser chrome. */}
                  <div className="mb-32 flex w-full flex-col gap-4 px-4 pt-4">
                    <WorkspaceHuddleCard
                      key={selectedAppointment.id}
                      appointment={selectedAppointment}
                      layout="mobile"
                    />
                    <PrevisitSection
                      key={`${selectedAppointment.id}-previsit`}
                      appointment={selectedAppointment}
                      layout="mobile"
                    />
                    <IntakeSection
                      key={`${selectedAppointment.id}-intake`}
                      appointment={selectedAppointment}
                      layout="mobile"
                    />
                    <RoomingSection
                      key={`${selectedAppointment.id}-rooming`}
                      appointment={selectedAppointment}
                      layout="mobile"
                    />
                    <VisitSection
                      key={`${selectedAppointment.id}-visit`}
                      appointment={selectedAppointment}
                      layout="mobile"
                    />
                    <LabsSection
                      key={`${selectedAppointment.id}-labs`}
                      appointment={selectedAppointment}
                      layout="mobile"
                    />
                    <CareManagementSection
                      key={`${selectedAppointment.id}-care-management`}
                      appointment={selectedAppointment}
                      layout="mobile"
                    />
                    <WrapUpSection
                      key={`${selectedAppointment.id}-wrap-up`}
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
              </AmbientListenProvider>
            ) : (
              <p className={cn("px-4 pb-8", textMeta)}>
                No appointment selected.
              </p>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
