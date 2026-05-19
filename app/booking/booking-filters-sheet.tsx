"use client";

import { ScheduleFilterMultiSelectDropdown } from "@/app/clinic-flow/schedule-filter-multiselect-dropdown";
import {
  SCHEDULE_BOTTOM_SHEET_BODY_OUTER_CLASS,
  SCHEDULE_BOTTOM_SHEET_BODY_SCROLL_CLASS,
  SCHEDULE_BOTTOM_SHEET_HEADER_CLASS,
  SCHEDULE_BOTTOM_SHEET_TITLE_CLASS,
  SCHEDULE_SHEET_OVERLAY_CLASS,
  scheduleBottomSheetContentClass,
} from "@/app/clinic-flow/schedule-bottom-sheet-frame";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function BookingFiltersSheet({
  open,
  onOpenChange,
  idPrefix,
  openFilterMenu,
  setOpenFilterMenu,
  pcpOptions,
  selectedPcps,
  onChangeSelectedPcps,
  navigatorOptions,
  selectedNavigators,
  onChangeSelectedNavigators,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idPrefix: string;
  openFilterMenu: string | null;
  setOpenFilterMenu: (id: string | null) => void;
  pcpOptions: readonly string[];
  selectedPcps: readonly string[];
  onChangeSelectedPcps: (next: string[]) => void;
  navigatorOptions: readonly string[];
  selectedNavigators: readonly string[];
  onChangeSelectedNavigators: (next: string[]) => void;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setOpenFilterMenu(null);
      }}
    >
      <SheetContent
        side="bottom"
        overlayClassName={SCHEDULE_SHEET_OVERLAY_CLASS}
        className={scheduleBottomSheetContentClass()}
      >
        <SheetHeader className={SCHEDULE_BOTTOM_SHEET_HEADER_CLASS}>
          <SheetTitle className={SCHEDULE_BOTTOM_SHEET_TITLE_CLASS}>
            Booking filters
          </SheetTitle>
        </SheetHeader>
        <div className={SCHEDULE_BOTTOM_SHEET_BODY_OUTER_CLASS}>
          <div
            className={cn(
              SCHEDULE_BOTTOM_SHEET_BODY_SCROLL_CLASS,
              "flex flex-col gap-2 px-2",
            )}
          >
            <ScheduleFilterMultiSelectDropdown
              idPrefix={`${idPrefix}-sheet`}
              menuId="pcp"
              openMenu={openFilterMenu}
              setOpenMenu={setOpenFilterMenu}
              categoryLabel="PCP"
              options={pcpOptions}
              selected={selectedPcps}
              onChangeSelected={onChangeSelectedPcps}
              fullWidth
              compact
            />
            <ScheduleFilterMultiSelectDropdown
              idPrefix={`${idPrefix}-sheet`}
              menuId="navigator"
              openMenu={openFilterMenu}
              setOpenMenu={setOpenFilterMenu}
              categoryLabel="Navigator"
              options={navigatorOptions}
              selected={selectedNavigators}
              onChangeSelected={onChangeSelectedNavigators}
              fullWidth
              compact
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
