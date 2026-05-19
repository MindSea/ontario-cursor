"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { HuddleHeaderButton } from "./huddle-header-button";
import { WorkspaceSectionsProvider } from "./workspace-section-collapse-context";
import {
  ScheduleViewToggle,
  type ScheduleViewMode,
} from "./schedule-view-toggle";
import { SchedulePatientSearch } from "./schedule-patient-search";

import {
  ScheduleToolbar,
  type ScheduleToolbarProps,
} from "./schedule-toolbar";

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
  onOpenPatientProfile?: (patientId: string) => void;
  huddleButton?: { onClick: () => void } | null;
  /** Merged onto the root wrapper (shell visibility from `page.tsx` + `useClinicFlowShellLayout`). */
  className?: string;
};

/** Same visual width as desktop header compact search (`md:w-64`). */
const MOBILE_SEARCH_FIELD_WIDTH_PX = 256;
const HEADER_ICON_PX = 36; /* size-9 */
const HEADER_GAP_PX = 8; /* gap-2 */
/** Minimum horizontal space for the page title before we drop to search takeover. */
const TITLE_MIN_FOR_INLINE_PX = 100;

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
  onOpenPatientProfile,
  huddleButton,
  className,
}: ClinicFlowMobileProps) {
  /**
   * Inline patient-search expansion in the mobile title bar.
   *
   * Tapping the magnifier swaps the default chrome (sidebar + title +
   * search icon) for a row with a fixed-width field (256px, matching
   * desktop `md:w-64`), an X to dismiss on the right, and the same
   * `SchedulePatientSearch` listbox as desktop.
   *
   * When the row is too narrow for sidebar + title + fixed field + X,
   * the sidebar and title hide so the input can grow to full width.
   */
  const [searchExpanded, setSearchExpanded] = useState(false);
  /** When true, the row is too narrow for sidebar + title + fixed search + X; hide chrome so search fills the row. */
  const [searchTakeover, setSearchTakeover] = useState(false);
  const headerBarRef = useRef<HTMLDivElement>(null);
  const workspaceScrollRef = useRef<HTMLDivElement>(null);
  const searchIdPrefix = useId();
  /* `SchedulePatientSearch` builds its `<input>` id as
   * `${idPrefix}-patient-search` — mirror that here so the focus
   * effect targets the correct element. */
  const searchInputDomId = `${searchIdPrefix}-patient-search`;

  useLayoutEffect(() => {
    if (!searchExpanded) {
      setSearchTakeover(false);
      return;
    }
    const el = headerBarRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const padX =
        parseFloat(cs.paddingLeft || "0") + parseFloat(cs.paddingRight || "0");
      const inner = Math.max(0, r.width - padX);
      const needInline =
        HEADER_ICON_PX +
        HEADER_GAP_PX +
        TITLE_MIN_FOR_INLINE_PX +
        HEADER_GAP_PX +
        MOBILE_SEARCH_FIELD_WIDTH_PX +
        HEADER_GAP_PX +
        HEADER_ICON_PX;
      setSearchTakeover(inner < needInline);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [searchExpanded]);

  useEffect(() => {
    if (!searchExpanded) return;
    /* Focus AFTER the title bar layout settles so iOS / Android raise
     * the keyboard predictably and the listbox anchors below the
     * already-laid-out input. */
    const raf = window.requestAnimationFrame(() => {
      document.getElementById(searchInputDomId)?.focus();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [searchExpanded, searchInputDomId, searchTakeover]);

  const collapseSearch = useCallback(() => {
    setSearchExpanded(false);
    setSearchTakeover(false);
    scheduleToolbarProps.onPatientSearchQueryChange("");
  }, [scheduleToolbarProps]);

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
            ref={headerBarRef}
            className={cn(
              "flex h-12 w-full min-w-0 shrink-0 items-center gap-2 border-b border-border/60 bg-background px-3",
              textBody,
            )}
          >
            {searchExpanded ? (
              <>
                {searchTakeover ? null : (
                  <>
                    <SidebarTrigger className="shrink-0" />
                    <h1 className="min-w-0 flex-1 truncate text-lg font-semibold leading-tight tracking-tight">
                      {CLINIC_FLOW_PAGE_TITLE}
                    </h1>
                  </>
                )}
                <div
                  className={cn(
                    "min-w-0",
                    searchTakeover ? "flex-1" : "w-64 shrink-0",
                  )}
                >
                  <SchedulePatientSearch
                    idPrefix={searchIdPrefix}
                    allAppointments={scheduleToolbarProps.allAppointments}
                    patientSearchQuery={scheduleToolbarProps.patientSearchQuery}
                    onPatientSearchQueryChange={
                      scheduleToolbarProps.onPatientSearchQueryChange
                    }
                    onNavigateToAppointment={
                      scheduleToolbarProps.onNavigateToAppointment
                    }
                    onAfterPick={() => {
                      setSearchExpanded(false);
                      setSearchTakeover(false);
                    }}
                    fullWidth
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 rounded-lg"
                  aria-label="Close patient search"
                  onClick={collapseSearch}
                >
                  <X className="size-5 text-foreground" aria-hidden />
                </Button>
              </>
            ) : (
              <>
                <SidebarTrigger className="shrink-0" />
                <h1 className="min-w-0 flex-1 truncate text-lg font-semibold leading-tight tracking-tight">
                  {CLINIC_FLOW_PAGE_TITLE}
                </h1>
                {huddleButton ? (
                  <HuddleHeaderButton
                    onClick={huddleButton.onClick}
                    className="shrink-0"
                  />
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 rounded-lg"
                  aria-label="Open patient search"
                  onClick={() => setSearchExpanded(true)}
                >
                  <Search className="size-5 text-foreground" aria-hidden />
                </Button>
              </>
            )}
          </div>
          <TabsList
            variant="line"
            className="grid min-h-10 w-full max-w-[100vw] shrink-0 grid-cols-2 gap-0 rounded-none border-0 border-b border-border/60 bg-background px-3 py-1 overflow-x-hidden"
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
          <ScheduleToolbar
            {...scheduleToolbarProps}
            layout="panel"
            panelSheetsOnly={mobileTab === "workspace"}
          />
          {mobileTab === "schedule" ? (
            <>
              <ScheduleDateRow
                selectedDate={selectedDate}
                onShiftDay={onShiftDay}
                onGoToday={onGoToday}
                fullBleed
                className="w-full shrink-0 border-x-0 px-3"
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
                onOpenPatientProfile={onOpenPatientProfile}
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
            ref={workspaceScrollRef}
            value="workspace"
            data-workspace-scroll-container
            aria-label="Workspace"
            className={MOBILE_TAB_PANEL_SCROLL_CLASS}
          >
            {selectedAppointment ? (
              <AmbientListenProvider key={selectedAppointment.id}>
                <WorkspaceSectionsProvider
                  appointmentId={selectedAppointment.id}
                  stage={selectedAppointment.stage}
                  scrollContainerRef={workspaceScrollRef}
                >
                  {/* Side gutters, air below sticky patient header, bottom margin above browser chrome. */}
                  <div className="mb-32 flex w-full flex-col gap-4 px-3 pt-4 md:px-4">
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
                </WorkspaceSectionsProvider>
              </AmbientListenProvider>
            ) : (
              <p className={cn("px-3 pb-8 md:px-4", textMeta)}>
                No appointment selected.
              </p>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
