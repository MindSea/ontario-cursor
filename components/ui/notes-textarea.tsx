import * as React from "react";

import { textBody } from "@/lib/typography";
import { cn } from "@/lib/utils";

/** Shared styles: single-line appearance, grows with content (`field-sizing: content`). */
export const notesTextareaClassName = cn(
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
  "min-h-8 max-h-[min(40vh,18rem)] resize-none overflow-y-auto [field-sizing:content]",
  textBody,
);

export const NotesTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(function NotesTextarea({ className, rows = 1, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      data-slot="notes-textarea"
      className={cn(notesTextareaClassName, className)}
      {...props}
    />
  );
});

NotesTextarea.displayName = "NotesTextarea";
