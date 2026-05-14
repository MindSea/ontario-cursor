"use client";

import { format, parseISO } from "date-fns";
import { MessageSquarePlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import type { Conversation, DirectoryPerson, Message } from "./types";
import { buildDirectoryLookup, formatThreadParticipantList } from "./utils";

export type MessagingInboxProps = {
  conversations: readonly Conversation[];
  messages: readonly Message[];
  directory: readonly DirectoryPerson[];
  /** Used to list the signed-in person first in each thread title. */
  currentUser: DirectoryPerson;
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  /**
   * If provided, the inbox renders a header row above the conversation
   * list with a "New conversation" button (desktop pill + mobile icon).
   * Consumers are expected to gate this on `canStartNewThread(currentUser)`
   * so the inbox itself stays role-agnostic.
   */
  onStartNewThread?: () => void;
};

function lastActivityMs(
  conversationId: string,
  messages: readonly Message[],
): number {
  let max = 0;
  for (const m of messages) {
    if (m.conversationId !== conversationId) continue;
    const t = new Date(m.sentAt).getTime();
    if (t > max) max = t;
  }
  return max;
}

function previewSnippet(messages: readonly Message[], conversationId: string): string {
  const list = messages.filter((m) => m.conversationId === conversationId);
  if (list.length === 0) return "No messages yet";
  const last = list.reduce((a, b) =>
    new Date(a.sentAt) > new Date(b.sentAt) ? a : b,
  );
  if (last.deletedAt) return "Message removed";
  const text = last.body.trim();
  return text.length > 72 ? `${text.slice(0, 72)}…` : text;
}

function lastMessage(
  messages: readonly Message[],
  conversationId: string,
): Message | undefined {
  const list = messages.filter((m) => m.conversationId === conversationId);
  if (list.length === 0) return undefined;
  return list.reduce((a, b) =>
    new Date(a.sentAt) > new Date(b.sentAt) ? a : b,
  );
}

export function MessagingInbox({
  conversations,
  messages,
  directory,
  currentUser,
  activeId,
  onSelectConversation,
  onStartNewThread,
}: MessagingInboxProps) {
  const sorted = [...conversations].sort(
    (a, b) =>
      lastActivityMs(b.id, messages) - lastActivityMs(a.id, messages),
  );

  const directoryByKey = buildDirectoryLookup(directory);

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden md:w-[min(100%,22rem)] md:shrink-0">
      {/* No right-side border here on purpose: the parent layout owns the
       * column divider via `md:border-l` on the thread pane. Drawing one here
       * stacks two 1px borders side-by-side (the inner scrollbar then sits
       * left of that stack), which reads as a thicker line next to the
       * scrollbar in the messaging view. */}
      {onStartNewThread ? (
        /* Sticky header inside the inbox column so the affordance is
         * always visible above the conversation list, even as the list
         * scrolls. Sits inside the column so the mobile two-pane CSS
         * (`hidden` on the column when a thread is open) hides it too. */
        <div
          className={cn(
            "flex shrink-0 items-center justify-between gap-2 border-b border-border/40 bg-background px-3 py-2 md:px-4",
          )}
        >
          <h2
            className={cn(
              "m-0 truncate font-medium text-foreground",
              textBody,
            )}
          >
            Conversations
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onStartNewThread}
            className="hidden h-8 shrink-0 gap-1.5 px-3 md:inline-flex"
          >
            <MessageSquarePlus className="size-4 shrink-0" aria-hidden />
            New conversation
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onStartNewThread}
            aria-label="New conversation"
            className="size-9 shrink-0 rounded-lg md:hidden"
          >
            <MessageSquarePlus className="size-5 text-foreground" aria-hidden />
          </Button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {sorted.length === 0 ? (
          <p
            className={cn(
              "m-0 px-3 py-4 text-muted-foreground md:px-4",
              textMeta,
            )}
          >
            No conversations yet.
          </p>
        ) : null}
        <ul className="m-0 list-none p-0">
          {sorted.map((c) => {
            const title = formatThreadParticipantList(
              c,
              directoryByKey,
              currentUser,
            );
            const preview = previewSnippet(messages, c.id);
            const last = lastMessage(messages, c.id);
            const timeLabel = last
              ? format(parseISO(last.sentAt), "MMM d, h:mm a")
              : "";
            const isActive = activeId === c.id;
            return (
              <li key={c.id} className="border-b border-border/40 last:border-b-0">
                <button
                  type="button"
                  onClick={() => onSelectConversation(c.id)}
                  className={cn(
                    "flex w-full min-w-0 flex-col gap-0.5 px-3 py-3 text-left transition-colors md:px-4",
                    isActive
                      ? "bg-muted/80"
                      : "hover:bg-muted/45 active:bg-muted/55",
                  )}
                >
                  <span className="flex flex-wrap items-baseline gap-2">
                    {c.isDraft ? (
                      <Badge variant="secondary" className="shrink-0 font-normal">
                        Draft
                      </Badge>
                    ) : null}
                    <span
                      className={cn(
                        "min-w-0 wrap-break-word font-medium text-foreground",
                        textBody,
                      )}
                    >
                      {title}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "line-clamp-2 text-muted-foreground",
                      textMeta,
                    )}
                  >
                    {preview}
                  </span>
                  {timeLabel ? (
                    <span className={cn("tabular-nums text-muted-foreground/90", textMeta)}>
                      {timeLabel}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
