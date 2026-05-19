import { textBody } from "@/lib/typography";
import { cn } from "@/lib/utils";

/** Reason line shared by workspace pinned header and huddle patient cards. */
export function WorkspaceVisitReasonLine({
  reason,
  className,
}: {
  reason: string;
  className?: string;
}) {
  return (
    <p className={cn("min-w-0 truncate", textBody, className)}>
      <span className="font-medium text-muted-foreground">
        Reason for Visit:{" "}
      </span>
      {reason}
    </p>
  );
}
