"use client";

import { filteredResultsEmptyMessage, type FilteredResultsEntity } from "@/lib/filtered-results-empty";
import { textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function FilteredResultsEmptyState({
  entity,
  hasSearch,
  hasToolbarFilters,
  locationPhrase,
  onClearSearch,
  onClearFilters,
  align = "start",
  className,
}: {
  entity: FilteredResultsEntity;
  hasSearch: boolean;
  hasToolbarFilters: boolean;
  locationPhrase?: string;
  onClearSearch?: () => void;
  onClearFilters?: () => void;
  /** Horizontal alignment of message and actions. */
  align?: "start" | "center";
  className?: string;
}) {
  const message = filteredResultsEmptyMessage(entity, {
    hasSearch,
    hasToolbarFilters,
    locationPhrase,
  });

  const showClearSearch = hasSearch && onClearSearch;
  const showClearFilters = hasToolbarFilters && onClearFilters;
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 py-6",
        centered ? "items-center text-center" : "items-start",
        className,
      )}
      role="status"
    >
      <p className={cn("m-0 text-muted-foreground", textMeta)}>{message}</p>
      {showClearSearch || showClearFilters ? (
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-3 gap-y-1",
            centered && "justify-center",
          )}
        >
          {showClearSearch ? (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto min-w-0 px-0 py-0 text-sm text-muted-foreground hover:text-foreground"
              onClick={onClearSearch}
            >
              Clear search
            </Button>
          ) : null}
          {showClearFilters ? (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto min-w-0 px-0 py-0 text-sm text-muted-foreground hover:text-foreground"
              onClick={onClearFilters}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
