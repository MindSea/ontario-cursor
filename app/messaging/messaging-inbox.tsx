"use client";

import { format, parseISO } from "date-fns";

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
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewThread: () => void;
  showNewThreadButton: boolean;
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
  activeId,
  onSelectConversation,
  onNewThread,
  showNewThreadButton,
}: MessagingInboxProps) {
  const sorted = [...conversations].sort(
    (a, b) =>
      lastActivityMs(b.id, messages) - lastActivityMs(a.id, messages),
  );

  const directoryByKey = buildDirectoryLookup(directory);

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col border-border/60 md:w-[min(100%,22rem)] md:shrink-0 md:border-r">
      <div className="flex shrink-0 flex-col gap-2 border-b border-border/60 p-3">
        {showNewThreadButton ? (
          <Button type="button" size="sm" variant="default" onClick={onNewThread}>
            New thread
          </Button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <ul className="m-0 list-none p-0">
          {sorted.map((c) => {
            const title = formatThreadParticipantList(c, directoryByKey);
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
                    "flex w-full min-w-0 flex-col gap-0.5 px-3 py-3 text-left transition-colors",
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
