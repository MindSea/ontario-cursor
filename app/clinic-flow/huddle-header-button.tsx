"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HuddleHeaderButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className={cn("h-8 shrink-0", className)}
      onClick={onClick}
    >
      Huddle
    </Button>
  );
}
