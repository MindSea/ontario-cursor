"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { textBody, textOverline } from "@/lib/typography";
import { cn } from "@/lib/utils";

import type { Appointment, HuddleTask } from "./types";

function cloneHuddleTasks(tasks: readonly HuddleTask[]): HuddleTask[] {
  return tasks.map((t) => ({ ...t }));
}

/**
 * HUDDLE tasks are local-only: add, toggle, and delete only update this component’s state — never
 * sync `huddleTasks` back into `appointments` or seed data. A full page refresh restores seed tasks.
 */
export function WorkspaceHuddleCard({
  appointment,
  layout,
}: {
  appointment: Appointment;
  layout: "mobile" | "desktop";
}) {
  const [tasks, setTasks] = useState<HuddleTask[]>(() =>
    cloneHuddleTasks(appointment.huddleTasks ?? []),
  );
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const composerRowRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!composerOpen) return;
    inputRef.current?.focus();
  }, [composerOpen]);

  const toggleTask = (taskId: string, completed: boolean) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed } : t)),
    );
  };

  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const commitComposer = () => {
    const text = draft.trim();
    if (text) {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `huddle-${Date.now()}`;
      const newTask: HuddleTask = { id, text, completed: false };
      setTasks((prev) => [...prev, newTask]);
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

  const body = (
    <>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h3 className={cn("min-w-0", textOverline)}>HUDDLE</h3>
        <div className="flex shrink-0 items-center gap-2">
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
        </div>
      </div>
      <ul className="mt-3 block w-full min-w-0 list-none p-0">
        {tasks.map((task) => {
          const controlId = `huddle-${appointment.id}-${task.id}`;
          return (
            <li
              key={task.id}
              className="group flex w-full min-w-0 items-center gap-2 py-1 md:py-0.5"
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
                  "size-7 shrink-0 text-muted-foreground transition-opacity hover:bg-destructive/10 hover:text-destructive md:size-8",
                  "max-md:opacity-100 md:opacity-0 md:group-hover:opacity-100 group-focus-within:opacity-100",
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
            className="flex w-full min-w-0 items-center gap-2 py-1 md:py-0.5"
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
                  commitComposer();
                } else if (e.key === "Escape") {
                  e.preventDefault();
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
    </>
  );

  const huddleSectionSurface =
    "border border-border bg-muted/40 shadow-md ring-1 ring-border/50";

  if (layout === "mobile") {
    return (
      <section
        className={cn(
          textBody,
          "block w-full rounded-xl px-4 pt-4 pb-2",
          huddleSectionSurface,
        )}
      >
        {body}
      </section>
    );
  }

  return (
    <section
      className={cn(
        textBody,
        "block w-full rounded-lg px-6 pt-6 pb-4",
        huddleSectionSurface,
      )}
    >
      {body}
    </section>
  );
}
