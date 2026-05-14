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

import { formatAppointmentStage } from "@/app/clinic-flow/stage-display";
import type { Appointment } from "@/app/clinic-flow/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  appointmentShowsRoom,
  appointmentSortKey,
  usePatientProfileClinicMessagingDemo,
} from "./patient-profile-demo-data";
import { PatientConversationsPanel } from "./patient-conversations-panel";
import {
  PATIENT_PROFILE_SECTIONS,
  type PatientProfileSection,
} from "./patient-profile-sections";
import { appointmentsForPatient } from "./queries";
import type {
  LongTermPanelTask,
  LongTermTaskSource,
  LongTermTaskStage,
  PatientCondition,
  PatientContactAdmin,
  PatientContactMethodPreference,
  PatientProfileAggregate,
} from "./types";
import { useDirtyRegistration } from "./use-patient-profile-dirty";
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
  "portal",
  "other",
];

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
  const [contact, setContact] = useState<PatientContactAdmin>(initialContact);
  /**
   * Baseline that the dirty check compares against. Initialized from the seed and
   * advanced whenever the user saves so the close prompt stops firing after a save.
   */
  const [savedBaseline, setSavedBaseline] =
    useState<PatientContactAdmin>(initialContact);
  /** Toast supports an optional action button (e.g. Undo) attached for ~6s. */
  type ToastAction = { label: string; onClick: () => void };
  type ToastState = { id: number; message: string; action?: ToastAction };
  const [toast, setToast] = useState<ToastState | null>(null);

  /* Tasks are lifted here so navigating between sections (Panel ⇄ Conversations ⇄
   * Appointments ⇄ Contact) preserves in-flight edits. Dialog remounts on patient
   * change via the `key={patientId}` prop, which resets this back to the seed. */
  const [tasks, setTasks] = useState<readonly LongTermPanelTask[]>(panel.tasks);

  /** Demo: stringify compare matches the seed shape and stays cheap for one form. */
  const contactDirty = useMemo(
    () => JSON.stringify(contact) !== JSON.stringify(savedBaseline),
    [contact, savedBaseline],
  );
  useDirtyRegistration("contact-admin", contactDirty);

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

  const demo = usePatientProfileClinicMessagingDemo();
  const patientId = summary.patientId;

  const profileAppointments = useMemo(() => {
    return [...appointmentsForPatient(demo.appointments, patientId)].sort(
      (a, b) => appointmentSortKey(b) - appointmentSortKey(a),
    );
  }, [demo.appointments, patientId]);

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
         * - Panel / Appointments / Contact: `overflow-y-auto` so the centered
         *   max-w-3xl column scrolls vertically inside the section.
         *   `scrollbar-gutter: stable` reserves the scrollbar gutter even
         *   when content doesn't overflow, so adding content that pushes
         *   past one viewport (e.g. expanding the Add task form) doesn't
         *   shrink the inner width and shift the centered column left.
         *   (Tailwind 4.3 ships `scrollbar-gutter-stable`; we're on 4.2.4,
         *   so the arbitrary-property escape hatch emits the rule.)
         * - Conversations: full-bleed inbox + thread split. Each pane
         *   scrolls internally (matches /messaging), so the section itself
         *   is `overflow-hidden`. */
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col bg-background",
          activeSection === "conversations"
            ? "overflow-hidden"
            : "overflow-y-auto overscroll-contain [scrollbar-gutter:stable]",
        )}
      >
        {/* Centered column for Panel / Appointments / Contact. Hidden via
         * `display: none` (not unmounted) when Conversations is active so
         * any in-flight contact-form / task edits stay alive. */}
        <div
          className={cn(
            "mx-auto w-full max-w-3xl flex-1 px-4 py-5 md:px-6 md:py-6",
            activeSection === "conversations" && "hidden",
          )}
        >
          {activeSection === "panel" ? (
            <PanelManagementSection
              conditions={panel.conditions}
              tasks={tasks}
              setTasks={setTasks}
              showToast={showToast}
            />
          ) : activeSection === "appointments" ? (
            <AppointmentsSection
              appointments={profileAppointments}
              onOpenClinicFlow={() =>
                showToast("Open this visit in Clinic Flow (demo).")
              }
            />
          ) : activeSection === "contact" ? (
            <ContactAdminForm
              value={contact}
              onChange={setContact}
              onSave={() => {
                /* Advance baseline so the form is no longer dirty;
                 * a subsequent close attempt skips the discard prompt. */
                setSavedBaseline(contact);
                showToast("Contact details saved (demo — not persisted).");
              }}
            />
          ) : null}
        </div>

        {/* Conversations is always mounted (hidden via `display: none` when
         * another section is active) so the panel's UI state (active
         * conversation, mobile two-pane) survives tab switches inside the
         * dialog. The panel reads from the shared `MessagingStoreProvider`,
         * so messages sent here are also visible at `/messaging`.
         *
         * The panel owns its own outer padding (matching `/messaging`'s
         * `max-w-6xl + px-8 + py-4`), so we deliberately don't add any
         * here. Padding here would stack with the panel's, leaving the
         * thread column wider than `/messaging` and adding visible extra
         * whitespace around message bubbles + composer. */}
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col",
            activeSection !== "conversations" && "hidden",
          )}
        >
          <PatientConversationsPanel patientId={patientId} />
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

function AppointmentsSection({
  appointments,
  onOpenClinicFlow,
}: {
  appointments: readonly Appointment[];
  onOpenClinicFlow: () => void;
}) {
  if (appointments.length === 0) {
    return (
      <p className={cn("m-0 text-muted-foreground", textMeta)}>
        No appointments for this patient in the rolling demo schedule.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      <ul className="m-0 list-none space-y-2 p-0">
        {appointments.map((apt) => (
          <li key={apt.id}>
            <ProfileAppointmentRow
              appointment={apt}
              onOpenClinicFlow={onOpenClinicFlow}
            />
          </li>
        ))}
      </ul>
      <p className={cn("m-0 text-muted-foreground", textMeta)}>
        Visit detail (huddle, previsit, etc.) can reuse the Clinic Flow
        workspace when you pick a row — same appointment payload as today.
      </p>
    </div>
  );
}

function ProfileAppointmentRow({
  appointment,
  onOpenClinicFlow,
}: {
  appointment: Appointment;
  onOpenClinicFlow: () => void;
}) {
  const day = parse(appointment.date, "yyyy-MM-dd", new Date());
  const dateLabel = format(day, "MMM d, yyyy");
  const showRoom = appointmentShowsRoom(appointment);

  return (
    <div
      className={cn(
        "rounded-md border border-border/60 bg-muted/10 px-3 py-2.5",
        textBody,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium tabular-nums text-foreground">
              {dateLabel}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {appointment.time}
            </span>
            <Badge variant="secondary" className="font-normal">
              {formatAppointmentStage(appointment.stage)}
            </Badge>
          </div>
          <p className={cn("m-0 text-foreground", textBody)}>
            <span className="text-muted-foreground">Reason: </span>
            {appointment.reason}
          </p>
          {showRoom && appointment.room ? (
            <p className={cn("m-0 text-muted-foreground", textMeta)}>
              Room {appointment.room}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={onOpenClinicFlow}
        >
          Clinic Flow
        </Button>
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

function ContactAdminForm({
  value,
  onChange,
  onSave,
}: {
  value: PatientContactAdmin;
  onChange: (next: PatientContactAdmin) => void;
  onSave: () => void;
}) {
  const uid = useId();
  const idp = (s: string) => `${uid}-${s}`;

  const patch = useCallback(
    (partial: Partial<PatientContactAdmin>) => {
      onChange({ ...value, ...partial });
    },
    [onChange, value],
  );

  const patchEmergency = useCallback(
    (partial: Partial<PatientContactAdmin["emergencyContact"]>) => {
      onChange({
        ...value,
        emergencyContact: { ...value.emergencyContact, ...partial },
      });
    },
    [onChange, value],
  );

  const fieldClass = "space-y-1.5";
  const inputClass = "h-9";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={fieldClass}>
          <label className={cn("block", textMeta)} htmlFor={idp("mobile")}>
            Mobile phone
          </label>
          <Input
            id={idp("mobile")}
            className={inputClass}
            value={value.mobilePhone}
            onChange={(e) => patch({ mobilePhone: e.target.value })}
          />
        </div>
        <div className={fieldClass}>
          <label className={cn("block", textMeta)} htmlFor={idp("home")}>
            Home phone
          </label>
          <Input
            id={idp("home")}
            className={inputClass}
            value={value.homePhone}
            onChange={(e) => patch({ homePhone: e.target.value })}
          />
        </div>
      </div>
      <div className={fieldClass}>
        <label className={cn("block", textMeta)} htmlFor={idp("email")}>
          Email
        </label>
        <Input
          id={idp("email")}
          className={inputClass}
          type="email"
          value={value.email}
          onChange={(e) => patch({ email: e.target.value })}
        />
      </div>
      <div className={fieldClass}>
        <label className={cn("block", textMeta)} htmlFor={idp("address")}>
          Home address
        </label>
        <textarea
          id={idp("address")}
          rows={3}
          value={value.homeAddress}
          onChange={(e) => patch({ homeAddress: e.target.value })}
          className={cn(
            "min-h-[5rem] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
            textBody,
          )}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={fieldClass}>
          <label className={cn("block", textMeta)} htmlFor={idp("lang")}>
            Primary language
          </label>
          <Input
            id={idp("lang")}
            className={inputClass}
            value={value.primaryLanguage}
            onChange={(e) => patch({ primaryLanguage: e.target.value })}
          />
        </div>
        <div className={cn(fieldClass, "flex flex-col justify-end")}>
          <div className="flex items-center gap-2 pb-2">
            <Checkbox
              id={idp("translate")}
              checked={value.translationRequired}
              onCheckedChange={(s) =>
                patch({ translationRequired: s === true })
              }
            />
            <label
              htmlFor={idp("translate")}
              className={cn("cursor-pointer", textBody)}
            >
              Translation required
            </label>
          </div>
        </div>
      </div>
      <div className={fieldClass}>
        <span className={cn("block", textMeta)}>
          Contact method preference
        </span>
        <Select
          value={value.contactMethodPreference}
          onValueChange={(v) =>
            patch({
              contactMethodPreference: v as PatientContactMethodPreference,
            })
          }
        >
          <SelectTrigger className={cn(inputClass, "w-full sm:max-w-xs")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONTACT_PREFS.map((pref) => (
              <SelectItem key={pref} value={pref}>
                {pref.charAt(0).toUpperCase() + pref.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border border-border/60 bg-muted/10 p-3">
        <h3 className={cn("mb-3 font-medium", textBody)}>Emergency contact</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className={fieldClass}>
            <label className={cn("block", textMeta)} htmlFor={idp("ec-name")}>
              Name
            </label>
            <Input
              id={idp("ec-name")}
              className={inputClass}
              value={value.emergencyContact.name}
              onChange={(e) => patchEmergency({ name: e.target.value })}
            />
          </div>
          <div className={fieldClass}>
            <label className={cn("block", textMeta)} htmlFor={idp("ec-rel")}>
              Relationship
            </label>
            <Input
              id={idp("ec-rel")}
              className={inputClass}
              value={value.emergencyContact.relationship}
              onChange={(e) =>
                patchEmergency({ relationship: e.target.value })
              }
            />
          </div>
          <div className={fieldClass}>
            <label className={cn("block", textMeta)} htmlFor={idp("ec-phone")}>
              Phone
            </label>
            <Input
              id={idp("ec-phone")}
              className={inputClass}
              value={value.emergencyContact.phone}
              onChange={(e) => patchEmergency({ phone: e.target.value })}
            />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={fieldClass}>
          <label className={cn("block", textMeta)} htmlFor={idp("pharmacy")}>
            Pharmacy of choice
          </label>
          <Input
            id={idp("pharmacy")}
            className={inputClass}
            value={value.pharmacyOfChoice}
            onChange={(e) => patch({ pharmacyOfChoice: e.target.value })}
          />
        </div>
        <div className={fieldClass}>
          <label className={cn("block", textMeta)} htmlFor={idp("insurance")}>
            Primary insurance
          </label>
          <Input
            id={idp("insurance")}
            className={inputClass}
            value={value.primaryInsurance}
            onChange={(e) => patch({ primaryInsurance: e.target.value })}
          />
        </div>
      </div>
      <Button type="button" onClick={onSave}>
        Save contact / admin
      </Button>
    </div>
  );
}
