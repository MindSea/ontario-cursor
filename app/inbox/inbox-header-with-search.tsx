"use client";

import {
  AppPageHeaderWithSearch,
  type AppPageHeaderWithSearchProps,
} from "@/components/app-page-header-with-search";

type InboxHeaderWithSearchProps = Omit<
  AppPageHeaderWithSearchProps,
  "title" | "filtersAriaLabel"
>;

/**
 * Inbox title bar with patient search and mobile filters affordance.
 */
export function InboxHeaderWithSearch(props: InboxHeaderWithSearchProps) {
  return (
    <AppPageHeaderWithSearch
      title="Inbox"
      filtersAriaLabel="Open inbox filters"
      {...props}
    />
  );
}
