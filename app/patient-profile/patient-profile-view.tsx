"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
import {
  differenceInCalendarDays,
  format,
  parse,
  parseISO,
  startOfDay,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  MessageSquare,
  Phone,
  Pin,
  Plus,
  Trash2,
  UserCircle,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotesTextarea } from "@/components/ui/notes-textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { patientAgeFromDateOfBirth } from "./age";
import { PatientAppointmentsPanel } from "./patient-appointments-panel";
import { PatientConversationsPanel } from "./patient-conversations-panel";
import {
  PATIENT_PROFILE_SECTIONS,
  type PatientProfileSection,
} from "./patient-profile-sections";
import type {
  LongTermPanelTask,
  LongTermTaskSource,
  LongTermTaskStage,
  PatientCondition,
  PatientContactAdmin,
  PatientContactMethodPreference,
  PatientEmergencyContact,
  PatientPharmacy,
  PatientPrimaryInsurance,
  PatientProfileAggregate,
} from "./types";
import { DatePicker } from "@/components/ui/date-picker";
import { InlineEditableText } from "./inline-editable-text";

function formatTaskStage(stage: LongTermTaskStage): string {
  switch (stage) {
    case "open":
      return "Open";
    case "in_progress":
      return "In progress";
    case "waiting_on_patient":
      return "Waiting on patient";
    case "waiting_on_external":
      return "Waiting on external";
    case "resolved":
      return "Resolved";
    default:
      return stage;
  }
}

function formatTaskSource(source: LongTermTaskSource): string {
  switch (source) {
    case "pcp":
      return "PCP";
    case "system":
      return "System";
    case "navigator":
      return "Navigator";
    default:
      return source;
  }
}

const TASK_STAGES: readonly LongTermTaskStage[] = [
  "open",
  "in_progress",
  "waiting_on_patient",
  "waiting_on_external",
  "resolved",
];

/** Title + description are read-only for tasks the system generated. Source is
 * displayed as a read-only badge for every source — there is no UI to change
 * a task's origin after creation. */
function isTextEditable(source: LongTermTaskSource): boolean {
  return source !== "system";
}

/** Due-date proximity buckets driving both the chip color and the sort rank.
 * Only `overdue` and `today` get a tinted chip; everything else (1+ days out,
 * or no date) stays visually neutral on purpose. */
type DueTone = "overdue" | "today" | "future" | "none";

/** `today` should be `startOfDay(new Date())` from the caller so the same
 * reference is used across compares within a render. */
function dueTone(dueDate: string | undefined, today: Date): DueTone {
  if (!dueDate) return "none";
  const due = startOfDay(parseISO(dueDate));
  const days = differenceInCalendarDays(due, today);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  return "future";
}

type DueToneClasses = {
  /** Border + background applied to the date-picker trigger. */
  chip: string;
  /** Hover override for the chip (loud states use a soft hover so the tint stays). */
  chipHover: string;
  /** Calendar icon color. */
  icon: string;
  /** Date-text color, or placeholder color when no date set. */
  text: string;
};

const DUE_TONE_CLASSES: Record<DueTone, DueToneClasses> = {
  overdue: {
    chip: "border-destructive/40 bg-destructive/10",
    chipHover: "hover:bg-destructive/15",
    icon: "text-destructive",
    text: "text-destructive font-medium",
  },
  today: {
    chip: "border-amber-300 bg-amber-100/60",
    chipHover: "hover:bg-amber-100",
    icon: "text-amber-700",
    text: "text-amber-700 font-medium",
  },
  future: {
    chip: "border-input bg-transparent",
    chipHover: "hover:bg-muted/40",
    icon: "text-muted-foreground",
    text: "text-foreground",
  },
  none: {
    chip: "border-input bg-transparent",
    chipHover: "hover:bg-muted/40",
    icon: "text-muted-foreground",
    text: "text-muted-foreground",
  },
};

const DUE_TONE_RANK: Record<DueTone, number> = {
  overdue: 0,
  today: 1,
  future: 2,
  none: 3,
};

/** Active-list sort: pinned first → due-date tone → due date asc (nulls last) →
 * newest createdAt desc. Resolved tasks are ordered newest-resolved first. */
function compareActiveTasks(
  a: LongTermPanelTask,
  b: LongTermPanelTask,
  today: Date,
): number {
  if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
  const at = dueTone(a.dueDate, today);
  const bt = dueTone(b.dueDate, today);
  if (at !== bt) return DUE_TONE_RANK[at] - DUE_TONE_RANK[bt];
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  return b.createdAt.localeCompare(a.createdAt);
}

function compareResolvedTasks(
  a: LongTermPanelTask,
  b: LongTermPanelTask,
): number {
  return (b.resolvedAt ?? b.updatedAt).localeCompare(
    a.resolvedAt ?? a.updatedAt,
  );
}

/** Stable enough for demo state (lives only in memory; not persisted). */
function makeTaskId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `lt-${crypto.randomUUID()}`;
  }
  return `lt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function genderLabel(
  g: PatientProfileAggregate["demographics"]["gender"],
): string {
  switch (g) {
    case "female":
      return "Female";
    case "male":
      return "Male";
    case "non_binary":
      return "Non-binary";
    case "unknown":
      return "Unknown";
    case "declined":
      return "Declined to answer";
    default:
      return g;
  }
}

const CONTACT_PREFS: readonly PatientContactMethodPreference[] = [
  "phone",
  "sms",
  "email",
];

/**
 * Explicit display labels. Title-casing via `charAt(0).toUpperCase() +
 * slice(1)` produces `"Sms"` for the SMS option which reads as a typo;
 * map values to their preferred capitalization here instead.
 */
const CONTACT_PREF_LABEL: Record<PatientContactMethodPreference, string> = {
  phone: "Phone",
  sms: "SMS",
  email: "Email",
};

export type PatientProfileViewProps = {
  aggregate: PatientProfileAggregate;
  activeSection: PatientProfileSection;
  onSectionChange: (section: PatientProfileSection) => void;
  /**
   * Invoked by the in-dialog close button. The dialog shell wraps this in a
   * dirty-discard confirm so the view itself does not need to know about state.
   */
  onCloseRequest: () => void;
  className?: string;
};

export function PatientProfileView({
  aggregate,
  activeSection,
  onSectionChange,
  onCloseRequest,
  className,
}: PatientProfileViewProps) {
  const { summary, demographics, panel, contactAdmin: initialContact } =
    aggregate;
  /**
   * Contact / admin state. Edits commit per-field (no global Save) — each
   * `InlineEditableText` blur / Enter calls `setContact`, mirroring how
   * panel-management tasks commit individually. Closing the dialog discards
   * unsaved edits implicitly (matches the demo's task semantics). The dirty
   * system intentionally does NOT track this section anymore.
   */
  const [contact, setContact] = useState<PatientContactAdmin>(initialContact);
  /** Toast supports an optional action button (e.g. Undo) attached for ~6s. */
  type ToastAction = { label: string; onClick: () => void };
  type ToastState = { id: number; message: string; action?: ToastAction };
  const [toast, setToast] = useState<ToastState | null>(null);

  /* Tasks are lifted here so navigating between sections (Panel ⇄ Conversations ⇄
   * Appointments ⇄ Contact) preserves in-flight edits. Dialog remounts on patient
   * change via the `key={patientId}` prop, which resets this back to the seed. */
  const [tasks, setTasks] = useState<readonly LongTermPanelTask[]>(panel.tasks);

  /* Toasts auto-dismiss after ~6s when the toast carries an action (Undo),
   * 2.4s when it's a transient confirmation. */
  useEffect(() => {
    if (!toast) return;
    const lifetime = toast.action ? 6000 : 2400;
    const id = toast.id;
    const t = window.setTimeout(() => {
      setToast((current) => (current && current.id === id ? null : current));
    }, lifetime);
    return () => window.clearTimeout(t);
  }, [toast]);

  const showToast = useCallback(
    (message: string, action?: { label: string; onClick: () => void }) => {
      setToast({ id: Date.now() + Math.random(), message, action });
    },
    [],
  );

  /* Refs for the section tabs strip + each tab button. The strip can overflow
   * horizontally on narrow viewports, so when the active section changes (or
   * the profile mounts) we scroll the active tab into view. Without this, a
   * deep-linked section that lives on the far right (e.g. Contact / Admin) or
   * far left (Panel management) lands offscreen on mobile. */
  const tabsNavRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Record<PatientProfileSection, HTMLButtonElement | null>>(
    {
      panel: null,
      conversations: null,
      appointments: null,
      contact: null,
    },
  );
  useEffect(() => {
    const nav = tabsNavRef.current;
    const tab = tabRefs.current[activeSection];
    if (!nav || !tab) return;
    /* Manual horizontal scroll instead of `scrollIntoView` so we don't also
     * affect the dialog's vertical scroll position. We center the tab inside
     * the visible strip when it doesn't fit; otherwise this is a no-op (the
     * Math.max keeps the new scroll position non-negative). */
    const target =
      tab.offsetLeft - (nav.clientWidth - tab.offsetWidth) / 2;
    const max = nav.scrollWidth - nav.clientWidth;
    nav.scrollLeft = Math.max(0, Math.min(target, max));
  }, [activeSection]);

  const patientId = summary.patientId;

  const dobParsed = parse(
    demographics.dateOfBirth,
    "yyyy-MM-dd",
    new Date(),
  );
  const dobDisplay = format(dobParsed, "MMM d, yyyy");
  const age = patientAgeFromDateOfBirth(demographics.dateOfBirth);

  const activeLabel =
    PATIENT_PROFILE_SECTIONS.find((s) => s.id === activeSection)?.label ??
    "Patient profile";

  return (
    <div
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col bg-background text-foreground",
        className,
      )}
    >
      <header className="relative shrink-0 border-b border-border/60 bg-background px-12 pt-3 pb-3 md:px-14 md:pt-4">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-1 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <UserCircle
              className="size-7 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <h1 className="text-lg font-semibold tracking-tight md:text-xl">
              {summary.displayName}
            </h1>
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label={`Call patient ${summary.displayName}`}
                onClick={() =>
                  showToast(`Calling ${summary.displayName} (demo).`)
                }
              >
                <Phone className="size-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                aria-label={`Message patient ${summary.displayName}`}
                onClick={() =>
                  showToast(`Message to ${summary.displayName} (demo).`)
                }
              >
                <MessageSquare className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
          <p
            className={cn(
              "m-0 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-muted-foreground",
              textMeta,
            )}
          >
            {[
              `PCP: ${summary.pcpDisplayName}`,
              `Navigator: ${summary.navigatorDisplayName}`,
              `DOB: ${dobDisplay}`,
              `Age: ${age}`,
              `Gender: ${genderLabel(demographics.gender)}`,
            ].map((item, i) => (
              <Fragment key={item}>
                {/* Below md, force a wrap before DOB so the line splits
                 * predictably into PCP|Navigator / DOB|Age|Gender instead
                 * of breaking at whatever flex-wrap picks first. The 0-height
                 * `basis-full` element pushes following items to the next row. */}
                {i === 2 ? (
                  <span
                    aria-hidden
                    className="block h-0 basis-full md:hidden"
                  />
                ) : null}
                {i > 0 ? (
                  <span
                    aria-hidden
                    className={cn(
                      "text-muted-foreground/50",
                      i === 2 && "max-md:hidden",
                    )}
                  >
                    |
                  </span>
                ) : null}
                <span className="whitespace-nowrap">{item}</span>
              </Fragment>
            ))}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 size-9 md:top-3 md:right-4"
          aria-label="Close patient profile"
          onClick={onCloseRequest}
        >
          <X className="size-5" aria-hidden />
        </Button>
      </header>

      {/* Horizontal section tabs (all sizes). The desktop left rail was folded
       * into this strip so the section content gets the full dialog width.
       *
       * Alignment is responsive: `justify-start` on mobile keeps the first tab
       * (Panel management) fully visible when the row overflows — with
       * `justify-center` the overflow gets split equally on both sides and the
       * first tab is clipped off the left edge. On `md+` there's enough room
       * for every tab so centering reads better. */}
      <nav
        ref={tabsNavRef}
        role="tablist"
        aria-label="Patient profile sections"
        className="flex w-full shrink-0 justify-start overflow-x-auto border-b border-border/60 bg-background px-2 md:justify-center md:px-4"
      >
        {PATIENT_PROFILE_SECTIONS.map((s) => {
          const isActive = s.id === activeSection;
          return (
            <button
              key={s.id}
              ref={(el) => {
                tabRefs.current[s.id] = el;
              }}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => onSectionChange(s.id)}
              className={cn(
                "shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors md:px-4",
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          );
        })}
      </nav>

      <section
        aria-label={activeLabel}
        /* Overflow behavior is per-section:
         * - Panel / Contact: `overflow-y-auto` so the centered max-w-3xl
         *   column scrolls vertically inside the section. `scrollbar-
         *   gutter: stable` reserves the scrollbar gutter even when
         *   content doesn't overflow, so adding content that pushes
         *   past one viewport (e.g. expanding the Add task form)
         *   doesn't shrink the inner width and shift the centered
         *   column left. (Tailwind 4.3 ships `scrollbar-gutter-stable`;
         *   we're on 4.2.4, so the arbitrary-property escape hatch
         *   emits the rule.)
         * - Conversations / Appointments: full-bleed list + detail
         *   split. Each pane scrolls internally (matches /messaging
         *   and /clinic-flow), so the section itself is
         *   `overflow-hidden`. */
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col bg-background",
          activeSection === "conversations" ||
            activeSection === "appointments"
            ? "overflow-hidden"
            : "overflow-y-auto overscroll-contain [scrollbar-gutter:stable]",
        )}
      >
        {/* Centered column for Panel / Contact. Hidden via `display: none`
         * (not unmounted) when a full-bleed section is active so any
         * in-flight contact-form / task edits stay alive across switches.
         *
         * Contact / admin uses a wider cap (`max-w-5xl`) than Panel
         * management (`max-w-3xl`): the 2-column card layout has real
         * horizontal demand (3-line address blocks were wrapping at
         * 3xl), whereas Panel management is a vertical task list that
         * reads better at a narrower line length. */}
        <div
          className={cn(
            "mx-auto w-full flex-1 px-4 py-5 md:px-6 md:py-6",
            activeSection === "contact" ? "max-w-5xl" : "max-w-3xl",
            (activeSection === "conversations" ||
              activeSection === "appointments") &&
              "hidden",
          )}
        >
          {activeSection === "panel" ? (
            <PanelManagementSection
              conditions={panel.conditions}
              tasks={tasks}
              setTasks={setTasks}
              showToast={showToast}
            />
          ) : activeSection === "contact" ? (
            <ContactAdminForm value={contact} onChange={setContact} />
          ) : null}
        </div>

        {/* Conversations + Appointments are always mounted (hidden via
         * `display: none` when another section is active) so each panel's
         * UI state (selection, mobile two-pane) survives tab switches.
         * Both panels read from app-wide stores so their data stays in
         * sync with /messaging and /clinic-flow respectively.
         *
         * Each panel owns its own outer padding (matching the source
         * surface's `max-w-6xl + px-8 + py-4`), so we deliberately don't
         * add any here. */}
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            activeSection !== "conversations" && "hidden",
          )}
        >
          <PatientConversationsPanel patientId={patientId} />
        </div>
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            activeSection !== "appointments" && "hidden",
          )}
        >
          <PatientAppointmentsPanel patientId={patientId} />
        </div>
      </section>

      {/* Portal so `fixed` is viewport-relative, not relative to the
       * transformed DialogContent (which would land the toast inside the
       * modal frame). z-index sits above DialogContent (z-116) + overlay.
       * The toast itself is pointer-events-none; only the optional action
       * button re-enables clicks so the user can hit Undo. */}
      {toast && typeof document !== "undefined"
        ? createPortal(
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "pointer-events-none fixed bottom-6 left-1/2 z-200 flex max-w-[min(90vw,28rem)] -translate-x-1/2 items-center gap-3 rounded-lg border border-border bg-background px-4 py-2 text-center shadow-lg",
                textBody,
              )}
            >
              <span className="min-w-0 flex-1">{toast.message}</span>
              {toast.action ? (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    setToast(null);
                  }}
                  className="pointer-events-auto shrink-0 rounded-md px-2 py-1 text-sm font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  {toast.action.label}
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function PanelManagementSection({
  conditions,
  tasks,
  setTasks,
  showToast,
}: {
  conditions: readonly PatientCondition[];
  tasks: readonly LongTermPanelTask[];
  setTasks: Dispatch<SetStateAction<readonly LongTermPanelTask[]>>;
  showToast: (
    message: string,
    action?: { label: string; onClick: () => void },
  ) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [showResolved, setShowResolved] = useState(false);

  /** Single `today` reference per render so date math is consistent across rows. */
  const today = useMemo(() => startOfDay(new Date()), []);

  const { active, resolved, overdueCount } = useMemo(() => {
    const activeList: LongTermPanelTask[] = [];
    const resolvedList: LongTermPanelTask[] = [];
    for (const t of tasks) {
      if (t.stage === "resolved") resolvedList.push(t);
      else activeList.push(t);
    }
    activeList.sort((a, b) => compareActiveTasks(a, b, today));
    resolvedList.sort(compareResolvedTasks);
    const overdue = activeList.filter(
      (t) => dueTone(t.dueDate, today) === "overdue",
    ).length;
    return { active: activeList, resolved: resolvedList, overdueCount: overdue };
  }, [tasks, today]);

  const handleAdd = useCallback(
    (task: LongTermPanelTask) => {
      setTasks((prev) => [...prev, task]);
      setIsAdding(false);
    },
    [setTasks],
  );

  const handleUpdate = useCallback(
    (id: string, patch: Partial<LongTermPanelTask>) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, ...patch, updatedAt: new Date().toISOString() }
            : t,
        ),
      );
    },
    [setTasks],
  );

  /* Stage transitions to "resolved" route through an undo toast so accidents
   * are recoverable. Snapshotted via closure so other unrelated edits during
   * the 6s window aren't blown away when Undo fires. */
  const resolveWithUndo = useCallback(
    (id: string, previousStage: LongTermTaskStage, previousResolvedAt: string | undefined) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                stage: "resolved",
                resolvedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }
            : t,
        ),
      );
      showToast("Task resolved.", {
        label: "Undo",
        onClick: () => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === id
                ? {
                    ...t,
                    stage: previousStage,
                    resolvedAt: previousResolvedAt,
                    updatedAt: new Date().toISOString(),
                  }
                : t,
            ),
          );
        },
      });
    },
    [setTasks, showToast],
  );

  const handleStageChange = useCallback(
    (id: string, nextStage: LongTermTaskStage) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      if (nextStage === "resolved" && task.stage !== "resolved") {
        resolveWithUndo(id, task.stage, task.resolvedAt);
        return;
      }
      const patch: Partial<LongTermPanelTask> = { stage: nextStage };
      if (nextStage !== "resolved" && task.resolvedAt) {
        patch.resolvedAt = undefined;
      }
      handleUpdate(id, patch);
    },
    [handleUpdate, resolveWithUndo, tasks],
  );

  /* Delete is one-step + Undo toast (no confirmation modal). Restoration tries
   * to keep the original index so the row reappears where the user expected. */
  const handleDelete = useCallback(
    (id: string) => {
      const idx = tasks.findIndex((t) => t.id === id);
      if (idx === -1) return;
      const removed = tasks[idx];
      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast("Task deleted.", {
        label: "Undo",
        onClick: () => {
          setTasks((prev) => {
            const next = [...prev];
            next.splice(Math.min(idx, next.length), 0, removed);
            return next;
          });
        },
      });
    },
    [setTasks, showToast, tasks],
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className={cn("mb-2 font-medium", textBody)}>Conditions</h3>
        {conditions.length === 0 ? (
          <p className={cn("text-muted-foreground", textMeta)}>
            No conditions on file.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {conditions.map((c) => (
              <Badge
                key={c.id}
                variant={c.isActive ? "secondary" : "outline"}
                className="font-normal"
                title={c.isActive ? undefined : "Inactive"}
              >
                {c.label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div>
        {/* `min-h-7` matches the `sm` Button height so the row's height stays
         * stable whether the "Add task" button is mounted or not. Without this,
         * clicking the button (which unmounts it) collapses the row to the
         * title's intrinsic height and visibly nudges the title up. */}
        <div className="mb-2 flex min-h-7 flex-wrap items-center justify-between gap-2">
          {/* Inner row uses `items-center` and a fixed-height badge so that the
           * Active-tasks title doesn't shift vertically when the overdue badge
           * mounts/unmounts. With baseline alignment + a `py-0.5` badge the
           * inner flex grew on the top edge and pushed the title up. */}
          <div className="flex items-center gap-2">
            <h3 className={cn("m-0 font-medium text-foreground", textBody)}>
              Active tasks{" "}
              <span className="font-normal text-muted-foreground">
                ({active.length})
              </span>
            </h3>
            {overdueCount > 0 ? (
              <span
                className={cn(
                  /* Last in `cn`: tailwind-merge keeps the destructive color so
                   * the badge text reads red. Previously `textMeta` (added
                   * second) was winning and rendering the text muted-gray. */
                  "inline-flex h-5 items-center rounded-full bg-destructive/10 px-2 text-sm font-medium leading-none",
                  "text-destructive",
                )}
              >
                {overdueCount} overdue
              </span>
            ) : null}
          </div>
          {!isAdding ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="size-4" aria-hidden />
              Add task
            </Button>
          ) : null}
        </div>

        {isAdding ? (
          <div className="mb-3">
            <TaskAddForm
              onAdd={handleAdd}
              onCancel={() => setIsAdding(false)}
              today={today}
            />
          </div>
        ) : null}

        {active.length === 0 ? (
          <p className={cn("text-muted-foreground", textMeta)}>
            No active tasks.
          </p>
        ) : (
          <ul className="m-0 list-none space-y-2 p-0">
            {active.map((task) => (
              <li key={task.id}>
                <TaskRow
                  task={task}
                  today={today}
                  onChange={(patch) => handleUpdate(task.id, patch)}
                  onStageChange={(s) => handleStageChange(task.id, s)}
                  onDelete={() => handleDelete(task.id)}
                />
              </li>
            ))}
          </ul>
        )}

        {resolved.length > 0 ? (
          <div className="mt-4">
            <h3 className="m-0">
              <button
                type="button"
                onClick={() => setShowResolved((v) => !v)}
                className={cn(
                  "group flex w-full items-center gap-1.5 rounded-md py-1 text-left font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  textBody,
                )}
                aria-expanded={showResolved}
              >
                {showResolved ? (
                  <ChevronDown
                    className="size-4 text-muted-foreground transition-colors group-hover:text-foreground"
                    aria-hidden
                  />
                ) : (
                  <ChevronRightIcon
                    className="size-4 text-muted-foreground transition-colors group-hover:text-foreground"
                    aria-hidden
                  />
                )}
                <span>
                  Resolved tasks{" "}
                  <span className="font-normal text-muted-foreground">
                    ({resolved.length})
                  </span>
                </span>
              </button>
            </h3>
            {showResolved ? (
              <ul className="m-0 mt-2 list-none space-y-2 p-0">
                {resolved.map((task) => (
                  <li key={task.id}>
                    <TaskRow
                      task={task}
                      today={today}
                      onChange={(patch) => handleUpdate(task.id, patch)}
                      onStageChange={(s) => handleStageChange(task.id, s)}
                      onDelete={() => handleDelete(task.id)}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  today,
  onChange,
  onStageChange,
  onDelete,
}: {
  task: LongTermPanelTask;
  today: Date;
  onChange: (patch: Partial<LongTermPanelTask>) => void;
  onStageChange: (next: LongTermTaskStage) => void;
  onDelete: () => void;
}) {
  const editable = isTextEditable(task.source);
  const tone = dueTone(task.dueDate, today);

  return (
    <div
      className={cn(
        "rounded-md border border-border/60 bg-muted/15 px-3 py-2.5",
        /* Pinned uses a neutral darker tint (no color) so the cue stays
         * recognizable without competing with the overdue / today coloring. */
        task.isPinned && "border-foreground/15 bg-muted/40",
        textBody,
      )}
    >
      {/* Top action row — pin + title + source + delete are all centered on
       * a single axis. Description and chip strip live below, indented under
       * the title so the metadata reads as belonging to the title, not the pin. */}
      <div className="flex items-center gap-1.5">
        <PinToggle
          isPinned={task.isPinned}
          onChange={(v) => onChange({ isPinned: v })}
        />
        <div className="min-w-0 flex-1">
          <InlineEditableText
            value={task.title}
            onChange={(v) => {
              const next = v.trim();
              if (next) onChange({ title: next });
            }}
            readOnly={!editable}
            className="font-medium text-foreground"
            ariaLabel="Task title"
          />
        </div>
        <SourceChip source={task.source} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-mr-1 size-7 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={`Delete task ${task.title}`}
          onClick={onDelete}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
      <div className="pl-9">
        <div className={cn("mt-1 text-muted-foreground", textMeta)}>
          <InlineEditableText
            value={task.detail ?? ""}
            onChange={(v) =>
              onChange({ detail: v.trim() ? v.trim() : undefined })
            }
            readOnly={!editable}
            multiline
            emptyAffordance={<span>+ Add note</span>}
            ariaLabel="Task note"
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <StageChip value={task.stage} onChange={onStageChange} />
          <DueDateChip
            value={task.dueDate}
            tone={tone}
            onChange={(d) => onChange({ dueDate: d })}
          />
        </div>
      </div>
    </div>
  );
}

function PinToggle({
  isPinned,
  onChange,
}: {
  isPinned: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "size-7 shrink-0",
        isPinned
          ? "text-foreground hover:text-foreground"
          : "text-muted-foreground/40 hover:text-foreground",
      )}
      aria-label={isPinned ? "Unpin task" : "Pin task"}
      aria-pressed={isPinned}
      onClick={() => onChange(!isPinned)}
    >
      <Pin
        className={cn("size-4", isPinned && "fill-current")}
        aria-hidden
      />
    </Button>
  );
}

function SourceChip({ source }: { source: LongTermTaskSource }) {
  /* Attribution is read-only for every source. New tasks are always stamped
   * `"navigator"` at creation; the badge here just labels who originated it. */
  return (
    <Badge variant="outline" className="shrink-0 font-normal">
      {formatTaskSource(source)}
    </Badge>
  );
}

function StageChip({
  value,
  onChange,
}: {
  value: LongTermTaskStage;
  onChange: (next: LongTermTaskStage) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as LongTermTaskStage)}
    >
      <SelectTrigger size="sm" className="min-w-40" aria-label="Stage">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="z-1000">
        {TASK_STAGES.map((s) => (
          <SelectItem key={s} value={s}>
            {formatTaskStage(s)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DueDateChip({
  value,
  tone,
  onChange,
}: {
  value: string | undefined;
  tone: DueTone;
  onChange: (next: string | undefined) => void;
}) {
  const parsed = value ? parseISO(value) : null;
  const classes = DUE_TONE_CLASSES[tone];
  return (
    <DatePicker value={value} onChange={onChange}>
      <button
        type="button"
        /* `text-base` matches the SelectTrigger used on the stage selector
         * next to this chip, so the two controls sit on the same baseline
         * with the same x-height. */
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-base transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
          classes.chip,
          classes.chipHover,
        )}
        aria-label="Due date"
      >
        <CalendarIcon className={cn("size-3.5", classes.icon)} aria-hidden />
        {parsed ? (
          <span className={cn("tabular-nums", classes.text)}>
            {format(parsed, "MMM d, yyyy")}
          </span>
        ) : (
          <span className={classes.text}>Set due date</span>
        )}
      </button>
    </DatePicker>
  );
}

function TaskAddForm({
  onAdd,
  onCancel,
  today,
}: {
  onAdd: (task: LongTermPanelTask) => void;
  onCancel: () => void;
  today: Date;
}) {
  const uid = useId();
  const idp = (s: string) => `${uid}-${s}`;
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [stage, setStage] = useState<LongTermTaskStage>("open");
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [isPinned, setIsPinned] = useState(false);

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const now = new Date().toISOString();
    /* New tasks created by the navigator are always sourced to `"navigator"`.
     * Source isn't editable in the UI, so this is the only place it's set. */
    onAdd({
      id: makeTaskId(),
      title: trimmedTitle,
      detail: detail.trim() ? detail.trim() : undefined,
      stage,
      source: "navigator",
      isPinned,
      dueDate,
      createdAt: now,
      updatedAt: now,
    });
  };

  return (
    /* Same chrome as a normal TaskRow so the form reads as "this is what the
     * task will look like once saved". The only differences vs a TaskRow are
     * (a) no delete icon, (b) no source badge, and (c) title + note are real
     * form fields with placeholder text instead of click-to-edit spans. */
    <div
      className={cn(
        "rounded-md border border-border/60 bg-muted/15 px-3 py-2.5",
        textBody,
      )}
    >
      <div className="flex items-center gap-1.5">
        <PinToggle isPinned={isPinned} onChange={setIsPinned} />
        <Input
          id={idp("title")}
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Task title"
          aria-label="Task title"
          className="h-8 flex-1"
        />
      </div>
      {/* `mt-2` puts breathing room between the title input and the note
       * input. `space-y-2` only controls gaps *between* children of this
       * column, not the gap above the first child, so we need an explicit
       * top margin here. */}
      <div className="mt-2 space-y-2 pl-9">
        <NotesTextarea
          id={idp("detail")}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder="Add a note"
          aria-label="Task note"
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <StageChip value={stage} onChange={setStage} />
          <DueDateChip
            value={dueDate}
            tone={dueTone(dueDate, today)}
            onChange={setDueDate}
          />
        </div>
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Add task
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Contact / Admin section.
 *
 * Layout: six titled subsections (Contact info, Home address,
 * Language & communication, Emergency contact, Pharmacy, Primary insurance).
 * Each row is a `[label · value]` pair where the value is click-to-edit,
 * matching the panel-management task title / note pattern.
 *
 * Saving: per-field auto-commit on blur / Enter (no global Save button,
 * no dirty registration). Closing the dialog discards in-flight edits
 * implicitly — same semantics as task editing.
 */
function ContactAdminForm({
  value,
  onChange,
}: {
  value: PatientContactAdmin;
  onChange: (next: PatientContactAdmin) => void;
}) {
  const patch = useCallback(
    (partial: Partial<PatientContactAdmin>) => {
      onChange({ ...value, ...partial });
    },
    [onChange, value],
  );

  const patchEmergency = useCallback(
    (partial: Partial<PatientEmergencyContact>) => {
      onChange({
        ...value,
        emergencyContact: { ...value.emergencyContact, ...partial },
      });
    },
    [onChange, value],
  );

  const patchPharmacy = useCallback(
    (partial: Partial<PatientPharmacy>) => {
      onChange({ ...value, pharmacy: { ...value.pharmacy, ...partial } });
    },
    [onChange, value],
  );

  const patchInsurance = useCallback(
    (partial: Partial<PatientPrimaryInsurance>) => {
      onChange({
        ...value,
        primaryInsurance: { ...value.primaryInsurance, ...partial },
      });
    },
    [onChange, value],
  );

  return (
    <div
      className={cn(
        /* Mobile: two columns stack vertically. md+: side-by-side. */
        "space-y-6",
        "md:grid md:grid-cols-2 md:gap-x-10 md:space-y-0",
      )}
    >
      <ContactColumn>
        <ContactSection title="Contact information">
          <ContactRow label="Mobile">
            <InlineEditableText
              value={value.mobilePhone}
              onChange={(v) => patch({ mobilePhone: v })}
              emptyAffordance="+ Add mobile phone"
              ariaLabel="Mobile phone"
            />
          </ContactRow>
          <ContactRow label="Home">
            <InlineEditableText
              value={value.homePhone}
              onChange={(v) => patch({ homePhone: v })}
              emptyAffordance="+ Add home phone"
              ariaLabel="Home phone"
            />
          </ContactRow>
          <ContactRow label="Email">
            <InlineEditableText
              value={value.email}
              onChange={(v) => patch({ email: v })}
              emptyAffordance="+ Add email"
              ariaLabel="Email"
            />
          </ContactRow>
        </ContactSection>

        <ContactSection title="Home address">
          <ContactRow label="Address">
            <InlineEditableText
              multiline
              value={value.homeAddress}
              onChange={(v) => patch({ homeAddress: v })}
              emptyAffordance="+ Add home address"
              ariaLabel="Home address"
            />
          </ContactRow>
        </ContactSection>

        <ContactSection title="Language & communication">
          <ContactRow label="Primary language">
            <InlineEditableText
              value={value.primaryLanguage}
              onChange={(v) => patch({ primaryLanguage: v })}
              emptyAffordance="+ Add primary language"
              ariaLabel="Primary language"
            />
          </ContactRow>
          <ContactRow label="Translation required">
            <ToggleYesNo
              value={value.translationRequired}
              onChange={(v) => patch({ translationRequired: v })}
              ariaLabel="Translation required"
            />
          </ContactRow>
          <ContactRow label="Contact method">
            <ContactMethodSelect
              value={value.contactMethodPreference}
              onChange={(v) => patch({ contactMethodPreference: v })}
            />
          </ContactRow>
        </ContactSection>
      </ContactColumn>

      <ContactColumn>
        <ContactSection title="Emergency contact">
          <ContactRow label="Name">
            <InlineEditableText
              value={value.emergencyContact.name}
              onChange={(v) => patchEmergency({ name: v })}
              emptyAffordance="+ Add name"
              ariaLabel="Emergency contact name"
            />
          </ContactRow>
          <ContactRow label="Relationship">
            <InlineEditableText
              value={value.emergencyContact.relationship}
              onChange={(v) => patchEmergency({ relationship: v })}
              emptyAffordance="+ Add relationship"
              ariaLabel="Emergency contact relationship"
            />
          </ContactRow>
          <ContactRow label="Phone">
            <InlineEditableText
              value={value.emergencyContact.phone}
              onChange={(v) => patchEmergency({ phone: v })}
              emptyAffordance="+ Add phone"
              ariaLabel="Emergency contact phone"
            />
          </ContactRow>
        </ContactSection>

        <ContactSection title="Pharmacy">
          <ContactRow label="Name">
            <InlineEditableText
              value={value.pharmacy.name}
              onChange={(v) => patchPharmacy({ name: v })}
              emptyAffordance="+ Add pharmacy name"
              ariaLabel="Pharmacy name"
            />
          </ContactRow>
          <ContactRow label="Address">
            <InlineEditableText
              multiline
              value={value.pharmacy.address}
              onChange={(v) => patchPharmacy({ address: v })}
              emptyAffordance="+ Add pharmacy address"
              ariaLabel="Pharmacy address"
            />
          </ContactRow>
          <ContactRow label="Phone">
            <InlineEditableText
              value={value.pharmacy.phone}
              onChange={(v) => patchPharmacy({ phone: v })}
              emptyAffordance="+ Add pharmacy phone"
              ariaLabel="Pharmacy phone"
            />
          </ContactRow>
        </ContactSection>

        <ContactSection title="Primary insurance">
          <ContactRow label="Carrier">
            <InlineEditableText
              value={value.primaryInsurance.carrier}
              onChange={(v) => patchInsurance({ carrier: v })}
              emptyAffordance="+ Add carrier"
              ariaLabel="Insurance carrier"
            />
          </ContactRow>
          <ContactRow label="Member ID">
            <InlineEditableText
              value={value.primaryInsurance.memberId}
              onChange={(v) => patchInsurance({ memberId: v })}
              emptyAffordance="+ Add member ID"
              ariaLabel="Insurance member ID"
            />
          </ContactRow>
          <ContactRow label="Group number">
            <InlineEditableText
              value={value.primaryInsurance.groupNumber}
              onChange={(v) => patchInsurance({ groupNumber: v })}
              emptyAffordance="+ Add group number"
              ariaLabel="Insurance group number"
            />
          </ContactRow>
        </ContactSection>
      </ContactColumn>
    </div>
  );
}

/**
 * One of the two visual columns in the Contact / Admin layout. A simple
 * vertical stack of bordered `ContactSection` cards. No cross-section
 * grid is needed anymore — each section owns its own grid with a fixed
 * label-column width (see `ContactSection`) so values left-align
 * consistently within the column AND across the two columns.
 */
function ContactColumn({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

/**
 * A titled, bordered subsection inside a `ContactColumn`.
 *
 * Layout choices:
 *   - `grid-cols-[10rem_1fr]` is a **fixed** label-column width, not
 *     `max-content`. This is what guarantees the user-visible promise
 *     that "the space between label and inputted field is the same
 *     between the two columns": both columns render with the same
 *     10rem label track, so values land at identical x positions in
 *     each column. 10rem comfortably fits the widest label in the
 *     form ("Translation required" ~9.5rem) with a small buffer.
 *   - `items-baseline` aligns the label baseline to the value's
 *     first-line baseline (single-line or multi-line), which reads as
 *     "label centered on the first line of the value" for our text
 *     sizes.
 *   - `gap-x-4` is the gutter between label and value; matched by
 *     the second visual column for free since both use this same
 *     ContactSection wrapper.
 *   - Border + padding turn each section into a discrete card so the
 *     groupings (Contact information / Home address / etc.) read as
 *     distinct units.
 */
function ContactSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border/60 bg-background p-4",
      )}
    >
      {/* `mb-3` (12px) on the title pushes the `dl` away from it.
       *
       * We can't use `space-y-*` on the parent here: the `dl` carries
       * `m-0` to neutralize its UA top/bottom margin, and in Tailwind v4
       * `m-0` is emitted as `margin: 0` which overrides the `margin-top`
       * that `space-y-*` adds to siblings. Using an explicit `mb-*` on
       * the heading sidesteps that cascade conflict entirely. */}
      <h3 className={cn("m-0 mb-3 font-medium", textBody)}>{title}</h3>
      <dl
        className={cn(
          "m-0 grid grid-cols-[10rem_1fr] items-baseline gap-x-4 gap-y-2",
        )}
      >
        {children}
      </dl>
    </section>
  );
}

/**
 * Single `[label · value]` row inside a `ContactSection`'s `<dl>`.
 * `<dt>` lands in the section grid's 10rem label column; `<dd>` fills
 * the rest. `whitespace-nowrap` keeps labels on one line so they read
 * cleanly in the fixed-width track.
 */
function ContactRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <>
      <dt
        className={cn(
          "text-muted-foreground whitespace-nowrap",
          textMeta,
        )}
      >
        {label}
      </dt>
      <dd className={cn("m-0 min-w-0", textBody)}>{children}</dd>
    </>
  );
}

/**
 * Click-to-toggle Yes / No control. Visually mirrors the
 * `InlineEditableText` display mode (text + hover background) so the
 * row reads the same as text rows in the section.
 */
function ToggleYesNo({
  value,
  onChange,
  ariaLabel,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-label={ariaLabel}
      aria-pressed={value}
      className={cn(
        "-mx-1 -my-0.5 cursor-pointer rounded-sm px-1 py-0.5 text-left hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none",
      )}
    >
      {value ? "Yes" : "No"}
    </button>
  );
}

/**
 * Contact method preference selector.
 *
 * Renders a `SelectTrigger` styled to sit unobtrusively in the row
 * (transparent background, no border, hover background to signal it's
 * clickable). Uses `size="sm"` rather than overriding the height — the
 * default `data-[size=*]:h-*` data-variant utilities have higher
 * cascade precedence than plain `h-auto`, so a manual `h-auto` override
 * silently doesn't apply and the trigger ends up rendering at a height
 * that broke the original click target. Letting `size="sm"` set h-7
 * keeps the click target reliable.
 */
function ContactMethodSelect({
  value,
  onChange,
}: {
  value: PatientContactMethodPreference;
  onChange: (next: PatientContactMethodPreference) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as PatientContactMethodPreference)}
    >
      <SelectTrigger
        size="sm"
        aria-label="Contact method"
        className={cn(
          "-mx-1 border-0 bg-transparent shadow-none",
          "hover:bg-muted/40",
          "focus:ring-0 focus-visible:ring-0 focus-visible:border-transparent",
          textBody,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      {/* `z-1000` lifts the portaled `SelectContent` above the patient
       * profile Dialog (z-50). Without it the dropdown opens but renders
       * behind the dialog and appears to do nothing. Every other Select
       * in the patient profile (Stage, Room, task Stage) uses the same
       * fix — see e.g. `StageChip`. */}
      <SelectContent className="z-1000">
        {CONTACT_PREFS.map((pref) => (
          <SelectItem key={pref} value={pref}>
            {CONTACT_PREF_LABEL[pref]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
