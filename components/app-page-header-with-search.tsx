"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ListFilter, Search, X } from "lucide-react";

import { InboxPatientFilterSearch } from "@/app/inbox/inbox-patient-filter-search";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { textBody } from "@/lib/typography";
import { cn } from "@/lib/utils";

const MOBILE_SEARCH_FIELD_WIDTH_PX = 256;
const HEADER_ICON_PX = 36;
const HEADER_GAP_PX = 8;
const TITLE_MIN_FOR_INLINE_PX = 100;

export type AppPageHeaderWithSearchProps = {
  title: string;
  patientSearch: string;
  onPatientSearchChange: (v: string) => void;
  /** Mobile: show filter affordance in the title bar. */
  filtersActive?: boolean;
  filterSheetOpen?: boolean;
  onOpenFilters?: () => void;
  filtersAriaLabel?: string;
};

/**
 * Full-bleed app page title bar with patient name search (Inbox, Panel
 * Management, etc.). Mirrors Clinic Flow mobile search expand/collapse.
 */
export function AppPageHeaderWithSearch({
  title,
  patientSearch,
  onPatientSearchChange,
  filtersActive = false,
  filterSheetOpen = false,
  onOpenFilters,
  filtersAriaLabel = "Open filters",
}: AppPageHeaderWithSearchProps) {
  const [isMd, setIsMd] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchTakeover, setSearchTakeover] = useState(false);
  const headerBarRef = useRef<HTMLDivElement>(null);
  const idPrefix = useId();
  const searchInputDomId = `${idPrefix}-patient-filter`;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsMd(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    if (isMd || !searchExpanded) {
      queueMicrotask(() => setSearchTakeover(false));
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
      const filterIcon = onOpenFilters ? HEADER_ICON_PX + HEADER_GAP_PX : 0;
      const needInline =
        HEADER_ICON_PX +
        HEADER_GAP_PX +
        TITLE_MIN_FOR_INLINE_PX +
        HEADER_GAP_PX +
        MOBILE_SEARCH_FIELD_WIDTH_PX +
        HEADER_GAP_PX +
        filterIcon +
        HEADER_ICON_PX;
      setSearchTakeover(inner < needInline);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMd, searchExpanded, onOpenFilters]);

  useEffect(() => {
    if (isMd || !searchExpanded) return;
    const raf = window.requestAnimationFrame(() => {
      document.getElementById(searchInputDomId)?.focus();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [isMd, searchExpanded, searchTakeover, searchInputDomId]);

  const collapseSearch = useCallback(() => {
    setSearchExpanded(false);
    setSearchTakeover(false);
    onPatientSearchChange("");
  }, [onPatientSearchChange]);

  const mobileFilterButton =
    !isMd && onOpenFilters && !searchExpanded ? (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative size-9 shrink-0 rounded-lg"
        aria-label={
          filtersActive
            ? `${filtersAriaLabel}, filters applied`
            : filtersAriaLabel
        }
        aria-pressed={filterSheetOpen}
        onClick={onOpenFilters}
      >
        <ListFilter className="size-5 text-foreground" aria-hidden />
        {filtersActive ? (
          <span
            className="absolute right-1 top-1 size-1.5 rounded-full bg-primary shadow-sm ring-2 ring-background"
            aria-hidden
          />
        ) : null}
      </Button>
    ) : null;

  return (
    <div className="box-border w-full min-w-full shrink-0 self-stretch border-b border-border/50 bg-background max-md:border-border/60">
      <div className="max-md:pt-[env(safe-area-inset-top)]">
        <div
          ref={headerBarRef}
          className={cn(
            "flex h-12 w-full min-w-0 shrink-0 items-center gap-2 px-3",
            "md:mx-auto md:max-w-6xl md:gap-2 md:px-8",
            textBody,
          )}
        >
          {isMd ? (
            <>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="flex w-9 shrink-0 items-center justify-center">
                  <SidebarTrigger className="shrink-0" />
                </div>
                <h1 className="min-w-0 shrink-0 truncate text-lg font-semibold leading-tight tracking-tight">
                  {title}
                </h1>
              </div>
              <InboxPatientFilterSearch
                idPrefix={idPrefix}
                value={patientSearch}
                onChange={onPatientSearchChange}
                size="compact"
                className="ml-auto min-w-0 w-[min(100%,16rem)] max-w-md shrink-0 md:w-64"
              />
            </>
          ) : searchExpanded ? (
            <>
              {searchTakeover ? null : (
                <>
                  <SidebarTrigger className="shrink-0" />
                  <h1 className="min-w-0 flex-1 truncate text-lg font-semibold leading-tight tracking-tight">
                    {title}
                  </h1>
                </>
              )}
              <div
                className={cn(
                  "min-w-0",
                  searchTakeover ? "flex-1" : "w-64 shrink-0",
                )}
              >
                <InboxPatientFilterSearch
                  idPrefix={idPrefix}
                  value={patientSearch}
                  onChange={onPatientSearchChange}
                  size="compact"
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
                {title}
              </h1>
              <div className="flex shrink-0 items-center gap-0.5">
                {mobileFilterButton}
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
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
