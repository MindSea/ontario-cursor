"use client";

import { format, parseISO } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { conversationReadyToMessage } from "./messaging-conversation-logic";
import { MessagingParticipantHeader } from "./messaging-participant-header";
import type { Conversation, DirectoryPerson, Message, ParticipantRef } from "./types";
import {
  buildDirectoryLookup,
  displayNameFor,
  roleBadgeLabel,
  sortMessagesAsc,
} from "./utils";

export type MessagingThreadProps = {
  conversation: Conversation | null;
  messages: readonly Message[];
  currentUser: DirectoryPerson;
  directory: readonly DirectoryPerson[];
  showMobileBack?: boolean;
  onMobileBack?: () => void;
  onSend: (body: string) => void;
  onEditMessage: (messageId: string, body: string) => void;
  onDeleteMessage: (messageId: string) => void;
  canSend?: boolean;
  rosterEditable?: boolean;
  onAddParticipant?: (person: DirectoryPerson) => void;
  onRemoveParticipant?: (ref: ParticipantRef) => void;
  onDiscardDraft?: () => void;
};

function isOwnMessage(m: Message, me: DirectoryPerson): boolean {
  if (m.variant === "system") return false;
  return m.senderKind === me.kind && m.senderId === me.id;
}

export function MessagingThread({
  conversation,
  messages,
  currentUser,
  directory,
  showMobileBack,
  onMobileBack,
  onSend,
  onEditMessage,
  onDeleteMessage,
  canSend = true,
  rosterEditable = false,
  onAddParticipant,
  onRemoveParticipant,
  onDiscardDraft,
}: MessagingThreadProps) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const directoryByKey = useMemo(
    () => buildDirectoryLookup(directory),
    [directory],
  );

  const threadMessages = useMemo(() => {
    if (!conversation) return [];
    return sortMessagesAsc(
      messages.filter((m) => m.conversationId === conversation.id),
    );
  }, [conversation, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [threadMessages.length, conversation?.id]);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const threadKindLabel = conversation
    ? conversation.isDraft
      ? "New thread"
      : conversation.type === "direct"
        ? "Direct message"
        : "Group message"
    : "Select a conversation";

  const openEdit = (m: Message) => {
    if (m.deletedAt || m.variant === "system") return;
    setEditId(m.id);
    setEditDraft(m.body);
    setEditOpen(true);
  };

  const submitEdit = () => {
    if (!editId) return;
    const trimmed = editDraft.trim();
    if (!trimmed) return;
    onEditMessage(editId, trimmed);
    setEditOpen(false);
    setEditId(null);
  };

  const confirmDelete = (id: string) => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Remove this message for everyone in the thread?")
    ) {
      onDeleteMessage(id);
    }
  };

  const submitSend = () => {
    if (!canSend) return;
    const t = draft.trim();
    if (!t || !conversation) return;
    onSend(t);
    setDraft("");
  };

  const needsMorePeople =
    conversation &&
    !conversationReadyToMessage(conversation) &&
    currentUser.kind !== "patient";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background">
      <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2.5 md:px-4">
        {showMobileBack ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 md:hidden"
            aria-label="Back to inbox"
            onClick={onMobileBack}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Button>
        ) : null}
        <h2
          className={cn(
            "min-w-0 flex-1 truncate text-base font-semibold leading-snug tracking-tight text-foreground",
            textBody,
          )}
        >
          {threadKindLabel}
        </h2>
      </div>

      {!conversation ? (
        <div className="flex flex-1 items-center justify-center px-4 py-12 text-center text-muted-foreground">
          <p className={cn("m-0 max-w-sm", textMeta)}>
            Choose a conversation from the list or start a new thread.
          </p>
        </div>
      ) : (
        <>
          <MessagingParticipantHeader
            conversation={conversation}
            directory={directory}
            currentUser={currentUser}
            canManageRoster={rosterEditable}
            onAddPerson={onAddParticipant ?? (() => {})}
            onRemovePerson={onRemoveParticipant ?? (() => {})}
            onDiscardDraft={onDiscardDraft}
          />

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 md:px-4">
            <div className="mx-auto flex max-w-3xl flex-col gap-3">
              {threadMessages.map((m) => {
                if (m.variant === "system") {
                  return (
                    <div
                      key={m.id}
                      className="flex w-full justify-center px-2 py-0.5"
                    >
                      <p
                        className={cn(
                          "m-0 max-w-[min(100%,36rem)] text-center text-muted-foreground",
                          textMeta,
                        )}
                      >
                        {m.body}
                      </p>
                      <span className="sr-only">
                        {format(parseISO(m.sentAt), "h:mm a")}
                      </span>
                    </div>
                  );
                }

                const own = isOwnMessage(m, currentUser);
                const senderLabel = displayNameFor(directoryByKey, {
                  kind: m.senderKind,
                  personId: m.senderId,
                });
                const roleLabel = roleBadgeLabel(m.senderKind);
                const timeStr = format(parseISO(m.sentAt), "MMM d, h:mm a");
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex w-full min-w-0",
                      own ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[min(100%,28rem)] rounded-lg border px-3 py-2 shadow-sm",
                        own
                          ? "border-primary/25 bg-primary/10"
                          : "border-border/70 bg-muted/40",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-1.5 gap-y-1">
                        <span
                          className={cn(
                            "font-medium text-foreground",
                            textMeta,
                          )}
                        >
                          {senderLabel}
                        </span>
                        <Badge variant="secondary" className="font-normal">
                          {roleLabel}
                        </Badge>
                        <span
                          className={cn(
                            "tabular-nums text-muted-foreground",
                            textMeta,
                          )}
                        >
                          {timeStr}
                          {m.editedAt ? (
                            <span className="text-muted-foreground/80">
                              {" "}
                              · edited
                            </span>
                          ) : null}
                        </span>
                      </div>
                      {m.deletedAt ? (
                        <p
                          className={cn(
                            "mt-1 mb-0 italic text-muted-foreground",
                            textMeta,
                          )}
                        >
                          This message was removed.
                        </p>
                      ) : (
                        <p
                          className={cn(
                            "mt-1 mb-0 whitespace-pre-wrap wrap-break-word text-foreground",
                            textBody,
                          )}
                        >
                          {m.body}
                        </p>
                      )}
                      {own && !m.deletedAt ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => openEdit(m)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={() => confirmDelete(m.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          </div>

          {needsMorePeople ? (
            <div className="shrink-0 border-t border-border/60 bg-muted/25 px-3 py-3 md:px-4">
              <p className={cn("m-0 text-muted-foreground", textMeta)}>
                Add at least one other person to send a message.
              </p>
            </div>
          ) : null}

          {canSend ? (
            <div className="shrink-0 border-t border-border/60 bg-background p-3 md:px-4">
              <div className="mx-auto flex max-w-3xl gap-2">
                <label className="sr-only" htmlFor="messaging-composer">
                  Message
                </label>
                <textarea
                  id="messaging-composer"
                  rows={2}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitSend();
                    }
                  }}
                  placeholder="Write a message…"
                  className={cn(
                    "min-h-11 w-full min-w-0 resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
                    textBody,
                  )}
                />
                <Button
                  type="button"
                  className="shrink-0 self-end"
                  onClick={submitSend}
                >
                  Send
                </Button>
              </div>
            </div>
          ) : !needsMorePeople ? (
            <div className="shrink-0 border-t border-border/60 bg-muted/30 px-3 py-3 md:px-4">
              <p className={cn("m-0 text-muted-foreground", textMeta)}>
                You can reply in threads you are part of. New threads are started
                by navigators or PCPs.
              </p>
            </div>
          ) : null}
        </>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit message</DialogTitle>
          </DialogHeader>
          <textarea
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            rows={4}
            className={cn(
              "min-h-20 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
              textBody,
            )}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submitEdit}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
