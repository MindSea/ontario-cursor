import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Layout shared by all muted-style tags (height, radius, padding, type). */
export const mutedTagBadgeLayoutClass =
  "h-6 min-h-6 w-fit shrink-0 justify-center overflow-hidden rounded-md px-2 py-0 font-medium leading-none";

/** Previsit / panels on `bg-background`: soft fill, no border (matches workspace chips). */
export const mutedTagBadgeSurfacePanelClass =
  "border-0 bg-muted text-foreground";

/**
 * Schedule visit cards sit on `bg-muted` / `bg-muted/30`. A slightly darker flat wash
 * (no border/shadow) so tags read on both selected and unselected rows.
 */
export const mutedTagBadgeSurfaceOnMutedParentClass =
  "border-0 bg-muted-foreground/15 text-foreground";

export function MutedTagBadge({
  children,
  className,
  /** `onMutedParent` = tags inside gray schedule cards; default = Previsit-style muted fill. */
  surface = "panel",
}: {
  children: React.ReactNode;
  className?: string;
  surface?: "panel" | "onMutedParent";
}) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        mutedTagBadgeLayoutClass,
        surface === "onMutedParent"
          ? mutedTagBadgeSurfaceOnMutedParentClass
          : mutedTagBadgeSurfacePanelClass,
        className,
      )}
    >
      {children}
    </Badge>
  );
}

/** Title-case each whitespace-delimited word (e.g. `WAIT` → `Wait`, `RM 1` → `Rm 1`). */
export function toTitleCaseTagLabel(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((word) =>
      word.length === 0
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}
