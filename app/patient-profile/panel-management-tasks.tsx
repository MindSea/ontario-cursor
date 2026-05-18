"use client";

import {
  useCallback,
  useId,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Pin,
  Plus,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
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

import { InlineEditableText } from "./inline-editable-text";
import type {
  LongTermPanelTask,
  LongTermTaskSource,
  LongTermTaskStage,
} from "./types";

export function formatTaskStage(stage: LongTermTaskStage): string {
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

export function formatTaskSource(source: LongTermTaskSource): string {
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

/** Title + description are read-only for tasks the system generated. */
export function isTextEditable(source: LongTermTaskSource): boolean {
  return source !== "system";
}

type DueTone = "overdue" | "today" | "future" | "none";

export function dueTone(dueDate: string | undefined, today: Date): DueTone {
  if (!dueDate) return "none";
  const due = startOfDay(parseISO(dueDate));
  const days = differenceInCalendarDays(due, today);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  return "future";
}

type DueToneClasses = {
  chip: string;
  chipHover: string;
  icon: string;
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

export function compareActiveTasks(
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

export function compareResolvedTasks(
  a: LongTermPanelTask,
  b: LongTermPanelTask,
): number {
  return (b.resolvedAt ?? b.updatedAt).localeCompare(
    a.resolvedAt ?? a.updatedAt,
  );
}

export function getActiveTasksSorted(
  tasks: readonly LongTermPanelTask[],
  today: Date,
): LongTermPanelTask[] {
  const active = tasks.filter((t) => t.stage !== "resolved");
  active.sort((a, b) => compareActiveTasks(a, b, today));
  return active;
}

/** Sort patients with active work ahead of idle patients; tie-break by top task. */
export function comparePatientsByActiveTasks(
  aTasks: readonly LongTermPanelTask[],
  bTasks: readonly LongTermPanelTask[],
  aName: string,
  bName: string,
  today: Date,
): number {
  const aActive = getActiveTasksSorted(aTasks, today);
  const bActive = getActiveTasksSorted(bTasks, today);
  const aHas = aActive.length > 0;
  const bHas = bActive.length > 0;
  if (aHas !== bHas) return aHas ? -1 : 1;
  if (!aHas && !bHas) return aName.localeCompare(bName);
  return compareActiveTasks(aActive[0], bActive[0], today);
}

export function makeTaskId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `lt-${crypto.randomUUID()}`;
  }
  return `lt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const TASK_STAGES: readonly LongTermTaskStage[] = [
  "open",
  "in_progress",
  "waiting_on_patient",
  "waiting_on_external",
  "resolved",
];

export type PanelTaskToast = (
  message: string,
  action?: { label: string; onClick: () => void },
) => void;

/**
 * Active + resolved panel tasks (no conditions block). Used from Patient
 * Profile and the global Inbox.
 */
export function PanelTasksSection({
  tasks,
  setTasks,
  showToast,
  addButtonSlot,
  embeddedInPatientCard = false,
  isAdding: isAddingProp,
  onIsAddingChange,
}: {
  tasks: readonly LongTermPanelTask[];
  setTasks: Dispatch<SetStateAction<readonly LongTermPanelTask[]>>;
  showToast: PanelTaskToast;
  /**
   * When set, the default outline "Add task" control is omitted and this node
   * is rendered in the active-task header row instead (e.g. Inbox uses a
   * primary button outside the row).
   */
  addButtonSlot?: ReactNode;
  /** Panel Management patient cards: active tasks only, no section chrome. */
  embeddedInPatientCard?: boolean;
  isAdding?: boolean;
  onIsAddingChange?: (open: boolean) => void;
}) {
  const [isAddingInternal, setIsAddingInternal] = useState(false);
  const isAdding = isAddingProp ?? isAddingInternal;
  const setIsAdding = onIsAddingChange ?? setIsAddingInternal;
  const [showResolved, setShowResolved] = useState(false);

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
    [setTasks, setIsAdding],
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
    <div>
      {!embeddedInPatientCard ? (
        <div className="mb-2 flex min-h-7 flex-wrap items-center justify-between gap-2">
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
                "inline-flex h-5 items-center rounded-full bg-destructive/10 px-2 text-sm font-medium leading-none",
                "text-destructive",
              )}
            >
              {overdueCount} overdue
            </span>
          ) : null}
        </div>
        {addButtonSlot ? (
          addButtonSlot
        ) : !isAdding ? (
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
      ) : null}

      <div
        className={cn(
          embeddedInPatientCard &&
            (isAdding || active.length > 0) &&
            "mt-3 space-y-3",
        )}
      >
        {isAdding ? (
          <div className={cn(!embeddedInPatientCard && "mb-3")}>
            <TaskAddForm
              onAdd={handleAdd}
              onCancel={() => setIsAdding(false)}
              today={today}
            />
          </div>
        ) : null}

        {active.length === 0 ? (
          embeddedInPatientCard ? null : (
            <p className={cn("text-muted-foreground", textMeta)}>
              No active tasks.
            </p>
          )
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
      </div>

      {!embeddedInPatientCard && resolved.length > 0 ? (
        <div className="mt-3">
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
  );
}

export function TaskRow({
  task,
  today,
  onChange,
  onStageChange,
  onDelete,
  attribution,
}: {
  task: LongTermPanelTask;
  today: Date;
  onChange: (patch: Partial<LongTermPanelTask>) => void;
  onStageChange: (next: LongTermTaskStage) => void;
  onDelete: () => void;
  /** Shown inside the card above the note (e.g. Inbox patient / care team). */
  attribution?: ReactNode;
}) {
  const editable = isTextEditable(task.source);
  const tone = dueTone(task.dueDate, today);

  return (
    <div
      className={cn(
        "rounded-md border border-border/60 bg-muted/15 px-3 py-2.5",
        task.isPinned && "border-foreground/15 bg-muted/40",
        textBody,
      )}
    >
      <div className="flex items-start gap-1.5">
        <div className="flex h-8 w-7 shrink-0 items-center justify-center">
          <PinToggle
            isPinned={task.isPinned}
            onChange={(v) => onChange({ isPinned: v })}
          />
        </div>
        <div className="flex min-h-8 min-w-0 flex-1 items-center">
          <InlineEditableText
            value={task.title}
            onChange={(v) => {
              const next = v.trim();
              if (next) onChange({ title: next });
            }}
            readOnly={!editable}
            compactSingleLine
            className="font-medium text-foreground"
            ariaLabel="Task title"
          />
        </div>
        <div className="flex h-8 shrink-0 items-center gap-0.5">
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
      </div>
      <div
        className={cn("pl-9", attribution ? "mt-2 space-y-2" : undefined)}
      >
        {attribution ? (
          <div className={cn("text-muted-foreground", textMeta)}>
            {attribution}
          </div>
        ) : null}
        <div
          className={cn(
            "text-muted-foreground",
            textMeta,
            !attribution && "mt-1",
          )}
        >
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
  className,
}: {
  isPinned: boolean;
  onChange: (next: boolean) => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "size-7 shrink-0",
        className,
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

export function TaskAddForm({
  onAdd,
  onCancel,
  today,
  patientSelector,
  submitDisabled = false,
  titleAutoFocus = true,
}: {
  onAdd: (task: LongTermPanelTask) => void;
  onCancel: () => void;
  today: Date;
  /** Rendered under the title row (e.g. Inbox patient `Select`). */
  patientSelector?: ReactNode;
  /** When true, blocks submit even if the title is non-empty. */
  submitDisabled?: boolean;
  /** When false, the title field does not steal focus on mount. */
  titleAutoFocus?: boolean;
}) {
  const uid = useId();
  const idp = (s: string) => `${uid}-${s}`;
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [stage, setStage] = useState<LongTermTaskStage>("open");
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [isPinned, setIsPinned] = useState(false);

  const trimmedTitle = title.trim();
  const canSubmit = trimmedTitle.length > 0 && !submitDisabled;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const now = new Date().toISOString();
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
          autoFocus={titleAutoFocus}
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
      <div className="mt-2 space-y-2 pl-9">
        {patientSelector ? (
          <div className="min-w-0">{patientSelector}</div>
        ) : null}
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
