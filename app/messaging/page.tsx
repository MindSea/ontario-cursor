"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { textBody } from "@/lib/typography";
import { cn } from "@/lib/utils";

import {
  conversationAfterFirstUserMessage,
  conversationReadyToMessage,
  canManageRoster,
  mergeConversationMessages,
  normalizeTypeForParticipantCount,
} from "./messaging-conversation-logic";
import { MessagingInbox } from "./messaging-inbox";
import { MessagingThread } from "./messaging-thread";
import { buildMessagingSeed, CURRENT_USER_ID } from "./seed-messaging";
import type { Conversation, DirectoryPerson, Message, ParticipantRef } from "./types";
import {
  canStartNewThread,
  dedupeParticipantRefs,
  displayNameFor,
  buildDirectoryLookup,
  findDirectConversation,
  findGroupWithParticipantSet,
  isParticipantInConversation,
  newConversationId,
  newMessageId,
  toParticipantRef,
} from "./utils";

function systemMessage(
  conversationId: string,
  body: string,
  actor: DirectoryPerson,
): Message {
  return {
    id: newMessageId(),
    conversationId,
    senderKind: actor.kind,
    senderId: actor.id,
    body,
    sentAt: new Date().toISOString(),
    variant: "system",
  };
}

export default function MessagingPage() {
  const seed = useMemo(() => buildMessagingSeed(), []);
  const currentUser = useMemo(
    () =>
      seed.directory.find((d) => d.id === CURRENT_USER_ID) ??
      seed.directory[0]!,
    [seed.directory],
  );
  const directoryByKey = useMemo(
    () => buildDirectoryLookup(seed.directory),
    [seed.directory],
  );

  const [conversations, setConversations] = useState<Conversation[]>(
    () => [...seed.conversations],
  );
  const [messages, setMessages] = useState<Message[]>(() => [...seed.messages]);
  const [activeId, setActiveId] = useState<string | null>(() =>
    seed.conversations[0]?.id ?? null,
  );

  const [isMd, setIsMd] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsMd(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const [mobileShowThread, setMobileShowThread] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const rosterEditable = useMemo(
    () => canManageRoster(currentUser),
    [currentUser],
  );

  const mergeIntoTarget = useCallback(
    (sourceId: string, targetId: string) => {
      setMessages((prev) => mergeConversationMessages(prev, sourceId, targetId));
      setConversations((prev) => prev.filter((c) => c.id !== sourceId));
      setActiveId(targetId);
    },
    [],
  );

  const appendSystem = useCallback(
    (conversationId: string, body: string) => {
      setMessages((prev) => [...prev, systemMessage(conversationId, body, currentUser)]);
    },
    [currentUser],
  );

  const startDraftThread = useCallback(() => {
    const me = toParticipantRef(currentUser);
    const id = newConversationId();
    const draft: Conversation = {
      id,
      type: "group",
      title: null,
      createdAt: new Date().toISOString(),
      participants: [me],
      isDraft: true,
    };
    setConversations((prev) => [draft, ...prev]);
    setActiveId(id);
    if (!isMd) setMobileShowThread(true);
  }, [currentUser, isMd]);

  const discardDraft = useCallback(() => {
    if (!activeId || !activeConversation?.isDraft) return;
    const id = activeId;
    setMessages((prev) => prev.filter((m) => m.conversationId !== id));
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setActiveId(next[0]?.id ?? null);
      return next;
    });
  }, [activeId, activeConversation?.isDraft]);

  const addParticipant = useCallback(
    (person: DirectoryPerson) => {
      if (!activeId || !rosterEditable) return;
      const ref = toParticipantRef(person);
      const me = toParticipantRef(currentUser);
      const mergedRef = { current: false };

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === activeId);
        if (idx === -1) return prev;
        const conv = prev[idx]!;
        if (conv.participants.some((p) => p.kind === ref.kind && p.personId === ref.personId))
          return prev;

        const nextParticipants = dedupeParticipantRefs([...conv.participants, ref]);
        const nextConv = normalizeTypeForParticipantCount({
          ...conv,
          participants: nextParticipants,
        });

        if (nextConv.type === "direct" && nextConv.participants.length === 2) {
          const [a, b] = nextConv.participants;
          const existing = findDirectConversation(prev, a, b, activeId);
          if (existing) {
            mergedRef.current = true;
            queueMicrotask(() => {
              mergeIntoTarget(activeId, existing.id);
            });
            return prev;
          }
        }

        if (nextConv.type === "group" && nextConv.participants.length >= 3) {
          const existingG = findGroupWithParticipantSet(
            prev,
            nextConv.participants,
            activeId,
          );
          if (existingG) {
            mergedRef.current = true;
            queueMicrotask(() => {
              mergeIntoTarget(activeId, existingG.id);
            });
            return prev;
          }
        }

        const updated = [...prev];
        updated[idx] = nextConv;
        return updated;
      });

      if (!mergedRef.current) {
        appendSystem(
          activeId,
          `${displayNameFor(directoryByKey, me)} added ${displayNameFor(directoryByKey, ref)} to the conversation.`,
        );
      }
    },
    [
      activeId,
      rosterEditable,
      currentUser,
      directoryByKey,
      mergeIntoTarget,
      appendSystem,
    ],
  );

  const removeParticipant = useCallback(
    (ref: ParticipantRef) => {
      if (!activeId || !rosterEditable) return;
      const me = toParticipantRef(currentUser);
      const mergedRef = { current: false };

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === activeId);
        if (idx === -1) return prev;
        const conv = prev[idx]!;
        const name = displayNameFor(directoryByKey, ref);
        const nextParticipants = conv.participants.filter(
          (p) => !(p.kind === ref.kind && p.personId === ref.personId),
        );
        if (nextParticipants.length < 2) return prev;

        const nextConv = normalizeTypeForParticipantCount({
          ...conv,
          participants: nextParticipants,
        });

        if (nextConv.type === "direct" && nextConv.participants.length === 2) {
          const [a, b] = nextConv.participants;
          const existing = findDirectConversation(prev, a, b, activeId);
          if (existing) {
            mergedRef.current = true;
            queueMicrotask(() => {
              mergeIntoTarget(activeId, existing.id);
            });
            return prev;
          }
        }

        const updated = [...prev];
        updated[idx] = nextConv;
        return updated;
      });

      if (!mergedRef.current) {
        appendSystem(
          activeId,
          `${displayNameFor(directoryByKey, me)} removed ${displayNameFor(directoryByKey, ref)} from the conversation.`,
        );
      }
    },
    [activeId, rosterEditable, directoryByKey, mergeIntoTarget, appendSystem, currentUser],
  );

  const sendMessage = useCallback(
    (body: string) => {
      if (!activeId || !body.trim() || !activeConversation) return;
      if (
        currentUser.kind === "patient" &&
        !isParticipantInConversation(activeConversation, currentUser)
      ) {
        return;
      }
      if (!conversationReadyToMessage(activeConversation)) return;

      const trimmed = body.trim();
      setMessages((prev) => [
        ...prev,
        {
          id: newMessageId(),
          conversationId: activeId,
          senderKind: currentUser.kind,
          senderId: currentUser.id,
          body: trimmed,
          sentAt: new Date().toISOString(),
          variant: "user",
        },
      ]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId && c.isDraft
            ? conversationAfterFirstUserMessage(c)
            : c,
        ),
      );
    },
    [activeId, activeConversation, currentUser],
  );

  const editMessage = useCallback((messageId: string, body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.variant !== "system"
          ? { ...m, body: trimmed, editedAt: now }
          : m,
      ),
    );
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    const now = new Date().toISOString();
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.variant !== "system"
          ? { ...m, deletedAt: now, body: "" }
          : m,
      ),
    );
  }, []);

  const selectConversation = useCallback(
    (id: string) => {
      setActiveId(id);
      if (!isMd) setMobileShowThread(true);
    },
    [isMd],
  );

  const showNewThread = canStartNewThread(currentUser);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background md:h-full">
      <div
        className={cn(
          "flex h-12 shrink-0 items-center gap-2 border-b border-border/60 bg-background px-4 max-md:pt-[env(safe-area-inset-top)]",
          textBody,
        )}
      >
        <SidebarTrigger className="shrink-0" />
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight">
          Messaging
        </h1>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-3 md:p-4">
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-0 md:flex-row md:rounded-lg md:border md:border-border/60",
            "max-md:min-h-[min(70vh,32rem)] md:overflow-hidden",
          )}
        >
          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col md:flex-row",
              !isMd && mobileShowThread && "hidden",
            )}
          >
            <MessagingInbox
              conversations={conversations}
              messages={messages}
              directory={seed.directory}
              activeId={activeId}
              onSelectConversation={selectConversation}
              onNewThread={startDraftThread}
              showNewThreadButton={showNewThread}
            />
          </div>

          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
              !isMd && !mobileShowThread && "hidden",
              isMd && "border-border/60 md:border-l",
            )}
          >
            <MessagingThread
              conversation={activeConversation}
              messages={messages}
              currentUser={currentUser}
              directory={seed.directory}
              showMobileBack={!isMd && mobileShowThread}
              onMobileBack={() => setMobileShowThread(false)}
              onSend={sendMessage}
              onEditMessage={editMessage}
              onDeleteMessage={deleteMessage}
              canSend={
                activeConversation != null &&
                conversationReadyToMessage(activeConversation) &&
                (currentUser.kind !== "patient" ||
                  isParticipantInConversation(activeConversation, currentUser))
              }
              rosterEditable={rosterEditable}
              onAddParticipant={addParticipant}
              onRemoveParticipant={(ref: ParticipantRef) =>
                removeParticipant(ref)
              }
              onDiscardDraft={
                activeConversation?.isDraft && rosterEditable
                  ? discardDraft
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
