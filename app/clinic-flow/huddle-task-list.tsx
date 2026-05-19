"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { textBody, textOverline } from "@/lib/typography";
import { cn } from "@/lib/utils";

import type { HuddleTask } from "./types";

function newHuddleTaskId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `huddle-${Date.now()}`;
}

export function HuddleTaskList({
  appointmentId,
  tasks,
  onTasksChange,
  compact = false,
  showLabel = true,
  sectionTitle,
}: {
  appointmentId: string;
  tasks: readonly HuddleTask[];
  onTasksChange: (tasks: HuddleTask[]) => void;
  /** Tighter rows for modal patient cards. */
  compact?: boolean;
  /** Modal cards: muted “Huddle tasks” label beside the add control. */
  showLabel?: boolean;
  /** Workspace HUDDLE card: overline title on the same row as “+ Add task”. */
  sectionTitle?: string;
}) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const composerRowRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!composerOpen) return;
    inputRef.current?.focus();
  }, [composerOpen]);

  const toggleTask = (taskId: string, completed: boolean) => {
    onTasksChange(
      tasks.map((t) => (t.id === taskId ? { ...t, completed } : t)),
    );
  };

  const removeTask = (taskId: string) => {
    onTasksChange(tasks.filter((t) => t.id !== taskId));
  };

  const commitComposer = () => {
    const text = draft.trim();
    if (text) {
      onTasksChange([
        ...tasks,
        { id: newHuddleTaskId(), text, completed: false },
      ]);
    }
    setComposerOpen(false);
    setDraft("");
  };

  const cancelComposer = () => {
    setComposerOpen(false);
    setDraft("");
  };

  const handleComposerBlur = () => {
    requestAnimationFrame(() => {
      if (composerRowRef.current?.contains(document.activeElement)) return;
      cancelComposer();
    });
  };

  const addTaskButton = (
    <Button
      type="button"
      variant="outline"
      size="xs"
      className="shrink-0"
      disabled={composerOpen}
      onClick={() => {
        setComposerOpen(true);
        setDraft("");
      }}
    >
      + Add task
    </Button>
  );

  const usesWorkspaceHeader = sectionTitle != null;

  return (
    <div className="min-w-0 w-full">
      {usesWorkspaceHeader ? (
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h3 className={cn("min-w-0", textOverline)}>{sectionTitle}</h3>
          {addTaskButton}
        </div>
      ) : (
        <div className="flex min-w-0 items-center justify-between gap-2">
          {showLabel ? (
            <span className={cn(textBody, "text-muted-foreground")}>
              Huddle tasks
            </span>
          ) : null}
          {addTaskButton}
        </div>
      )}
      <ul
        className={cn(
          usesWorkspaceHeader ? "mt-3" : "mt-2",
          "block w-full min-w-0 list-none p-0",
          tasks.length === 0 && !composerOpen && "hidden",
        )}
      >
        {tasks.map((task) => {
          const controlId = `huddle-${appointmentId}-${task.id}`;
          return (
            <li
              key={task.id}
              className={cn(
                "group flex w-full min-w-0 items-center gap-2",
                compact ? "py-0.5" : "py-1 md:py-0.5",
              )}
            >
              <Checkbox
                id={controlId}
                checked={task.completed}
                onCheckedChange={(state) => {
                  if (state === "indeterminate") return;
                  toggleTask(task.id, state === true);
                }}
                className="shrink-0"
              />
              <label
                htmlFor={controlId}
                className={cn(
                  "min-w-0 flex-1 cursor-pointer wrap-break-word select-none",
                  textBody,
                  task.completed && "text-muted-foreground/50 line-through",
                )}
              >
                {task.text}
              </label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "size-7 shrink-0 text-muted-foreground transition-opacity hover:bg-destructive/10 hover:text-destructive",
                  compact
                    ? "opacity-100"
                    : "max-md:opacity-100 md:size-8 md:opacity-0 md:group-hover:opacity-100 group-focus-within:opacity-100",
                )}
                aria-label={`Delete task: ${task.text}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeTask(task.id);
                }}
              >
                <Trash2 className="size-3.5 md:size-4" aria-hidden />
              </Button>
            </li>
          );
        })}
        {composerOpen ? (
          <li
            ref={composerRowRef}
            className={cn(
              "flex w-full min-w-0 items-center gap-2",
              compact ? "py-0.5" : "py-1 md:py-0.5",
            )}
          >
            <span
              className="flex shrink-0 cursor-text"
              onMouseDown={(e) => {
                e.preventDefault();
                inputRef.current?.focus();
              }}
            >
              <Checkbox
                disabled
                checked={false}
                className="pointer-events-none opacity-50"
                aria-hidden
                tabIndex={-1}
              />
            </span>
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={handleComposerBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  commitComposer();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  e.stopPropagation();
                  cancelComposer();
                }
              }}
              placeholder="New task…"
              className={cn(
                "h-auto min-w-0 flex-1 border-0 bg-transparent px-0 py-0 shadow-none outline-none ring-0 focus-visible:border-0 focus-visible:ring-0",
                textBody,
              )}
              aria-label="New huddle task"
            />
          </li>
        ) : null}
      </ul>
    </div>
  );
}
