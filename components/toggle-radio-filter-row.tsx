"use client";

import type { ReactNode } from "react";

import { RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

/** Radio row that clears when clicked while already selected. */
export function ToggleRadioFilterRow({
  optionValue,
  optionId,
  label,
  checked,
  onToggle,
  className,
}: {
  optionValue: string;
  optionId: string;
  label: ReactNode;
  checked: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <div
      role="radio"
      aria-checked={checked}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 px-3 py-2.5 hover:bg-muted",
        className,
      )}
    >
      <RadioGroupItem
        value={optionValue}
        id={optionId}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }}
      />
      <label
        htmlFor={optionId}
        className="min-w-0 flex-1 cursor-pointer text-sm leading-snug font-normal"
        onClick={(e) => e.preventDefault()}
      >
        {label}
      </label>
    </div>
  );
}
