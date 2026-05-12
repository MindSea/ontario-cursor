"use client";

import { format, parseISO } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  SCHEDULE_BOTTOM_SHEET_TITLE_CLASS,
} from "@/app/clinic-flow/schedule-bottom-sheet-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

const COMPOSER_MAX_HEIGHT_PX = 160;
const COMPOSER_MIN_HEIGHT_PX = 40;

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
  const composerRef = useRef<HTMLTextAreaElement>(null);
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

  useLayoutEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(
      Math.max(el.scrollHeight, COMPOSER_MIN_HEIGHT_PX),
      COMPOSER_MAX_HEIGHT_PX,
    );
    el.style.height = `${next}px`;
  }, [draft, conversation?.id, canSend]);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const threadKindLabel = conversation
    ? conversation.isDraft
      ? "New conversation"
      : conversation.type === "direct"
        ? "Direct message"
        : "Group message"
    : "Select a conversation";

  const canEditRoster =
    rosterEditable && conversation != null && conversation.type === "group";

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

  const confirmDeleteMessage = () => {
    if (!deleteTargetId) return;
    onDeleteMessage(deleteTargetId);
    setDeleteTargetId(null);
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
      <div className="w-full shrink-0 bg-background">
        <div
          className={cn(
            "flex shrink-0 items-center gap-2 border-b border-border/60 bg-background",
            /* Mobile: match Messaging chrome (h-12, px-3) so trigger/back and titles share one column grid. */
            "max-md:h-12 max-md:px-3 max-md:py-0",
            "md:min-h-10 md:px-4 md:py-2",
            textBody,
          )}
        >
          {showMobileBack ? (
            <div className="flex w-9 shrink-0 items-center justify-center md:hidden">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 rounded-lg"
                aria-label="Back to inbox"
                onClick={onMobileBack}
              >
                <ChevronLeft className="size-5 text-foreground" aria-hidden />
              </Button>
            </div>
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

        {conversation ? (
          <MessagingParticipantHeader
            conversation={conversation}
            directory={directory}
            currentUser={currentUser}
            canManageRoster={canEditRoster}
            onAddPerson={onAddParticipant ?? (() => {})}
            onRemovePerson={onRemoveParticipant ?? (() => {})}
            onDiscardDraft={onDiscardDraft}
          />
        ) : null}
      </div>

      {!conversation ? (
        <div className="flex flex-1 items-center justify-center px-3 py-12 text-center text-muted-foreground md:px-4">
          <p className={cn("m-0 max-w-sm", textMeta)}>
            Choose a conversation from the list or start a new conversation.
          </p>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-3">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-3 md:px-4">
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
                            onClick={() => setDeleteTargetId(m.id)}
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
            <div className="w-full shrink-0 border-t border-border/60 bg-muted/25">
              <div className="mx-auto w-full max-w-3xl px-3 py-3 md:px-4">
                <p className={cn("m-0 text-muted-foreground", textMeta)}>
                  Add at least one other person to send a message.
                </p>
              </div>
            </div>
          ) : null}

          {canSend ? (
            <div className="w-full shrink-0 border-t border-border/60 bg-background">
              <label className="sr-only" htmlFor="messaging-composer">
                Message
              </label>
              {/* Grid keeps Send bottom-aligned with the textarea on iOS Safari (flex items-end can mis-measure textareas). */}
              <div className="mx-auto grid w-full max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-end gap-2 px-3 py-3 md:px-4">
                <textarea
                  ref={composerRef}
                  id="messaging-composer"
                  rows={1}
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
                    "min-h-10 max-h-40 w-full min-w-0 resize-none overflow-y-auto rounded-lg border border-input bg-transparent px-2.5 py-2 text-base leading-snug outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
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
            <div className="w-full shrink-0 border-t border-border/60 bg-muted/30">
              <div className="mx-auto w-full max-w-3xl px-3 py-3 md:px-4">
                <p className={cn("m-0 text-muted-foreground", textMeta)}>
                  You can reply in conversations you are part of. New conversations
                  are started by navigators or PCPs.
                </p>
              </div>
            </div>
          ) : null}
        </>
      )}

      <Dialog
        open={deleteTargetId != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
      >
        <DialogContent className="flex max-h-[min(90vh,24rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="gap-0 shrink-0 border-b border-border/50 px-4 pb-3 pt-4 text-left">
            <DialogTitle className={SCHEDULE_BOTTOM_SHEET_TITLE_CLASS}>
              Delete message?
            </DialogTitle>
          </DialogHeader>
          <div className="px-4 py-3">
            <DialogDescription className="text-base leading-snug text-foreground">
              This removes the message for everyone in the conversation. This
              cannot be undone.
            </DialogDescription>
          </div>
          <DialogFooter className="mt-0 shrink-0 gap-2 border-t border-border/50 px-4 py-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTargetId(null)}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDeleteMessage}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="flex max-h-[min(90vh,28rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="gap-0 shrink-0 border-b border-border/50 px-4 pb-3 pt-4 text-left">
            <DialogTitle className={SCHEDULE_BOTTOM_SHEET_TITLE_CLASS}>
              Edit message
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <textarea
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              rows={4}
              className={cn(
                "min-h-24 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
                textBody,
              )}
            />
          </div>
          <DialogFooter className="mt-0 shrink-0 gap-2 border-t border-border/50 px-4 py-3">
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
