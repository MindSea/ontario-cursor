"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type InlineEditableTextProps = {
  value: string;
  onChange: (next: string) => void;
  /** Disable click-to-edit and hide the empty affordance. */
  readOnly?: boolean;
  /** Use a `<textarea>` instead of a single-line `<input>`. */
  multiline?: boolean;
  /** Affordance shown when the value is empty and the field is editable. */
  emptyAffordance?: ReactNode;
  /** Display-mode className (the static text). */
  className?: string;
  /** Edit-mode className applied on top of the input/textarea defaults. */
  editClassName?: string;
  ariaLabel?: string;
};

/**
 * Click-to-edit text. Display mode renders the value (with a hover affordance
 * when editable); clicking switches to an input/textarea, Enter commits a
 * single-line value, Cmd/Ctrl+Enter commits multiline, Esc cancels, blur commits.
 *
 * Used for task title (single-line) and task description (multiline). System
 * tasks pass `readOnly` so the click affordance is suppressed and the empty
 * affordance is omitted.
 */
export function InlineEditableText({
  value,
  onChange,
  readOnly = false,
  multiline = false,
  emptyAffordance,
  className,
  editClassName,
  ariaLabel,
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  /* Draft is only meaningful while editing; we seed it on entering edit mode
   * rather than mirroring `value` via an effect, which avoids the
   * derived-state anti-pattern (and lets the user keep typing even if `value`
   * changes upstream during edit). */
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const cancellingRef = useRef(false);

  /** Autofocus + select-all on entering edit mode. */
  useEffect(() => {
    if (!isEditing) return;
    const node = multiline ? textareaRef.current : inputRef.current;
    if (!node) return;
    node.focus();
    /* Select all on single-line inputs to mimic native rename UX. Multiline
     * stays as-is so the cursor lands at the start of the existing note. */
    if (!multiline) node.select();
  }, [isEditing, multiline]);

  const startEditing = () => {
    if (readOnly) return;
    setDraft(value);
    setIsEditing(true);
  };

  const commit = () => {
    const next = multiline ? draft : draft.trim();
    if (next !== value) onChange(next);
    setIsEditing(false);
  };

  const cancel = () => {
    cancellingRef.current = true;
    setDraft(value);
    setIsEditing(false);
  };

  const handleBlur = () => {
    if (cancellingRef.current) {
      cancellingRef.current = false;
      return;
    }
    commit();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
      return;
    }
    if (event.key === "Enter") {
      if (multiline) {
        /* Plain Enter inserts a newline; require Cmd/Ctrl+Enter to commit. */
        if (event.metaKey || event.ctrlKey) {
          event.preventDefault();
          commit();
        }
      } else {
        event.preventDefault();
        commit();
      }
    }
  };

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={textareaRef}
          value={draft}
          rows={1}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          aria-label={ariaLabel}
          /*
           * Single-line by default; grows with content via
           * `field-sizing: content`, then becomes a scroll area once the
           * content exceeds `max-h`. Matches the note field in TaskAddForm
           * (and the medication-notes textarea elsewhere) for consistency.
           */
          className={cn(
            "block w-full resize-none rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
            "min-h-8 max-h-[min(40vh,18rem)] overflow-y-auto field-sizing-content",
            editClassName,
          )}
        />
      );
    }
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        className={cn(
          "block w-full rounded-md border border-input bg-transparent px-2 py-1 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
          editClassName,
        )}
      />
    );
  }

  if (!value) {
    if (readOnly || !emptyAffordance) return null;
    return (
      <button
        type="button"
        onClick={startEditing}
        className="rounded-sm text-left text-muted-foreground italic hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {emptyAffordance}
      </button>
    );
  }

  return (
    <span
      role={readOnly ? undefined : "button"}
      tabIndex={readOnly ? undefined : 0}
      onClick={readOnly ? undefined : startEditing}
      onKeyDown={
        readOnly
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                startEditing();
              }
            }
      }
      className={cn(
        "block whitespace-pre-wrap rounded-sm px-1 py-0.5 -mx-1 -my-0.5",
        !readOnly &&
          "cursor-text hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none",
        className,
      )}
    >
      {value}
    </span>
  );
}
