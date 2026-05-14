"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  canManageRoster,
  conversationAfterFirstUserMessage,
  conversationReadyToMessage,
  mergeConversationMessages,
  normalizeTypeForParticipantCount,
} from "./messaging-conversation-logic";
import { buildMessagingSeed, CURRENT_USER_ID } from "./seed-messaging";
import type {
  Conversation,
  DirectoryPerson,
  Message,
  ParticipantRef,
} from "./types";
import {
  dedupeParticipantRefs,
  displayNameFor,
  buildDirectoryLookup,
  findDirectConversation,
  findGroupWithParticipantSet,
  isParticipantInConversation,
  newConversationId,
  newMessageId,
  participantSetKey,
  toParticipantRef,
} from "./utils";

/**
 * Application-wide messaging store.
 *
 * Owns the canonical `conversations`, `messages`, `directory`, and
 * `currentUser` state, so the `/messaging` page and the patient profile
 * dialog both read from and write to the same source. Without this, edits
 * made in one view stayed local and were invisible in the other.
 *
 * UI-only state (active conversation id, mobile two-pane state) is *not*
 * managed here — each consumer keeps its own view state.
 *
 * The store seeds itself once per provider mount via `buildMessagingSeed()`,
 * which is the same seed function the local store in messaging/page.tsx
 * used before.
 */

export type MessagingStoreValue = {
  conversations: Conversation[];
  messages: Message[];
  directory: DirectoryPerson[];
  /** Signed-in user (defaults to the demo navigator). */
  currentUser: DirectoryPerson;

  /** True when {@link currentUser} is permitted to add / remove roster. */
  rosterEditable: boolean;

  /** Sends a user message into the conversation; promotes a draft on first send. */
  sendMessage: (conversationId: string, body: string) => void;
  editMessage: (messageId: string, body: string) => void;
  deleteMessage: (messageId: string) => void;

  /**
   * Adds a participant. May merge into an existing conversation that shares
   * the resulting participant set, in which case the original conversation
   * is discarded and {@link MessagingStoreValue.lastMergedTargetId} surfaces
   * the survivor id so the UI can re-route its `activeId`. The same merging
   * semantics as messaging/page.tsx had before.
   */
  addParticipant: (conversationId: string, person: DirectoryPerson) => void;
  removeParticipant: (conversationId: string, ref: ParticipantRef) => void;

  /**
   * Creates a new draft conversation. Pre-seeded participants are merged
   * with the signed-in user. Returns the new conversation id so the caller
   * can mark it active in its local UI state.
   */
  startDraftThread: (seedParticipants?: readonly ParticipantRef[]) => string;

  /**
   * Removes a draft conversation and any in-flight messages. No-op if the
   * conversation isn't a draft (callers shouldn't be able to drop committed
   * threads through this path).
   */
  discardDraft: (conversationId: string) => void;
};

const MessagingStoreContext = createContext<MessagingStoreValue | null>(null);

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

export function MessagingStoreProvider({ children }: { children: ReactNode }) {
  /* Seed once per provider lifetime. Same seed function `/messaging` used
   * to call locally; the provider mounts at the root layout, so the seed
   * is shared across navigation between Clinic Flow / Messaging / patient
   * profile. */
  const seed = useMemo(() => buildMessagingSeed(), []);
  const currentUser = useMemo(
    () =>
      seed.directory.find((d) => d.id === CURRENT_USER_ID) ?? seed.directory[0]!,
    [seed.directory],
  );
  const directoryByKey = useMemo(
    () => buildDirectoryLookup(seed.directory),
    [seed.directory],
  );
  const rosterEditable = useMemo(
    () => canManageRoster(currentUser),
    [currentUser],
  );

  const [conversations, setConversations] = useState<Conversation[]>(
    () => [...seed.conversations],
  );
  const [messages, setMessages] = useState<Message[]>(() => [...seed.messages]);

  const mergeIntoTarget = useCallback(
    (sourceId: string, targetId: string) => {
      setMessages((prev) => mergeConversationMessages(prev, sourceId, targetId));
      setConversations((prev) => prev.filter((c) => c.id !== sourceId));
    },
    [],
  );

  const appendSystem = useCallback(
    (conversationId: string, body: string) => {
      setMessages((prev) => [
        ...prev,
        systemMessage(conversationId, body, currentUser),
      ]);
    },
    [currentUser],
  );

  const sendMessage = useCallback(
    (conversationId: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;

      const conv = conversations.find((c) => c.id === conversationId);
      if (!conv) return;
      if (
        currentUser.kind === "patient" &&
        !isParticipantInConversation(conv, currentUser)
      ) {
        return;
      }
      if (!conversationReadyToMessage(conv)) return;

      /* Merge-on-first-send: if `conversationId` is a draft and a
       * committed conversation with the same participant set already
       * exists, route the message into the committed one and discard the
       * draft. This is the send-time counterpart to the merge logic that
       * already runs in `addParticipant` / `removeParticipant`, and is
       * what enforces the "one conversation per exact participant set"
       * invariant when a draft is pre-seeded sendable (e.g. the patient
       * profile's New conversation flow seeds [you, patient] directly,
       * skipping the add-participant code path).
       *
       * After this runs, the panel/page derive `activeId` to the surviving
       * conversation automatically (the discarded draft id falls out of
       * the filtered list and the existing thread bubbles to the top of
       * the last-activity sort because of the new message). */
      let targetId = conversationId;
      if (conv.isDraft) {
        const key = participantSetKey(conv.participants);
        const existing = conversations.find(
          (c) =>
            c.id !== conversationId &&
            !c.isDraft &&
            participantSetKey(c.participants) === key,
        );
        if (existing) {
          targetId = existing.id;
          setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        } else {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === conversationId && c.isDraft
                ? conversationAfterFirstUserMessage(c)
                : c,
            ),
          );
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: newMessageId(),
          conversationId: targetId,
          senderKind: currentUser.kind,
          senderId: currentUser.id,
          body: trimmed,
          sentAt: new Date().toISOString(),
          variant: "user",
        },
      ]);
    },
    [currentUser, conversations],
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

  const addParticipant = useCallback(
    (conversationId: string, person: DirectoryPerson) => {
      if (!rosterEditable) return;
      const ref = toParticipantRef(person);
      const me = toParticipantRef(currentUser);
      const mergedRef = { current: false };

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversationId);
        if (idx === -1) return prev;
        const conv = prev[idx]!;
        if (
          conv.participants.some(
            (p) => p.kind === ref.kind && p.personId === ref.personId,
          )
        )
          return prev;

        const nextParticipants = dedupeParticipantRefs([
          ...conv.participants,
          ref,
        ]);
        const nextConv = normalizeTypeForParticipantCount({
          ...conv,
          participants: nextParticipants,
        });

        /* If adding this participant would converge to an existing direct or
         * matching group thread, merge into the survivor instead of mutating
         * in place. The survivor stays untouched; the source conversation is
         * dropped and its messages are reassigned (in a microtask so we don't
         * re-enter setState during another setState). */
        if (nextConv.type === "direct" && nextConv.participants.length === 2) {
          const [a, b] = nextConv.participants;
          const existing = findDirectConversation(prev, a, b, conversationId);
          if (existing) {
            mergedRef.current = true;
            queueMicrotask(() => {
              mergeIntoTarget(conversationId, existing.id);
            });
            return prev;
          }
        }

        if (nextConv.type === "group" && nextConv.participants.length >= 3) {
          const existingG = findGroupWithParticipantSet(
            prev,
            nextConv.participants,
            conversationId,
          );
          if (existingG) {
            mergedRef.current = true;
            queueMicrotask(() => {
              mergeIntoTarget(conversationId, existingG.id);
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
          conversationId,
          `${displayNameFor(directoryByKey, me)} added ${displayNameFor(
            directoryByKey,
            ref,
          )} to the conversation.`,
        );
      }
    },
    [rosterEditable, currentUser, directoryByKey, mergeIntoTarget, appendSystem],
  );

  const removeParticipant = useCallback(
    (conversationId: string, ref: ParticipantRef) => {
      if (!rosterEditable) return;
      const me = toParticipantRef(currentUser);
      const mergedRef = { current: false };

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversationId);
        if (idx === -1) return prev;
        const conv = prev[idx]!;
        const nextParticipants = conv.participants.filter(
          (p) => !(p.kind === ref.kind && p.personId === ref.personId),
        );
        /* Min two participants for any thread — refuse the removal that would
         * leave the conversation with only the signed-in user. */
        if (nextParticipants.length < 2) return prev;

        const nextConv = normalizeTypeForParticipantCount({
          ...conv,
          participants: nextParticipants,
        });

        if (nextConv.type === "direct" && nextConv.participants.length === 2) {
          const [a, b] = nextConv.participants;
          const existing = findDirectConversation(prev, a, b, conversationId);
          if (existing) {
            mergedRef.current = true;
            queueMicrotask(() => {
              mergeIntoTarget(conversationId, existing.id);
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
          conversationId,
          `${displayNameFor(directoryByKey, me)} removed ${displayNameFor(
            directoryByKey,
            ref,
          )} from the conversation.`,
        );
      }
    },
    [rosterEditable, currentUser, directoryByKey, mergeIntoTarget, appendSystem],
  );

  const startDraftThread = useCallback(
    (seedParticipants?: readonly ParticipantRef[]) => {
      const me = toParticipantRef(currentUser);
      const merged = dedupeParticipantRefs([me, ...(seedParticipants ?? [])]);

      /* Dedup against *drafts only*: if a still-pending draft with this
       * exact participant set already exists (e.g. user clicked
       * "New conversation" twice in a row without typing), reuse it
       * instead of stacking duplicates. We deliberately do NOT dedup
       * against committed conversations — preventing draft creation in
       * that case would block the very thing "New conversation" is for
       * (composing a thread with extra participants, e.g. starting a
       * group with the patient and their PCP).
       *
       * If the user ends up sending without growing the set past an
       * existing committed conversation, `sendMessage`'s merge-on-first-
       * send branch will route the message into the existing thread and
       * discard this draft — that's where the "one per participant set"
       * invariant lands for the profile flow. */
      const key = participantSetKey(merged);
      const existingDraft = conversations.find(
        (c) => c.isDraft && participantSetKey(c.participants) === key,
      );
      if (existingDraft) return existingDraft.id;

      const id = newConversationId();
      /* Start as `group`; `normalizeTypeForParticipantCount` flips to
       * `direct` when there are exactly two participants. Matches what
       * /messaging used to do, so fixtures still hold. */
      const draft: Conversation = normalizeTypeForParticipantCount({
        id,
        type: "group",
        title: null,
        createdAt: new Date().toISOString(),
        participants: merged,
        isDraft: true,
      });
      setConversations((prev) => [draft, ...prev]);
      return id;
    },
    [currentUser, conversations],
  );

  const discardDraft = useCallback((conversationId: string) => {
    setConversations((prev) => {
      const conv = prev.find((c) => c.id === conversationId);
      if (!conv?.isDraft) return prev;
      return prev.filter((c) => c.id !== conversationId);
    });
    setMessages((prev) => prev.filter((m) => m.conversationId !== conversationId));
  }, []);

  const value = useMemo<MessagingStoreValue>(
    () => ({
      conversations,
      messages,
      directory: seed.directory,
      currentUser,
      rosterEditable,
      sendMessage,
      editMessage,
      deleteMessage,
      addParticipant,
      removeParticipant,
      startDraftThread,
      discardDraft,
    }),
    [
      conversations,
      messages,
      seed.directory,
      currentUser,
      rosterEditable,
      sendMessage,
      editMessage,
      deleteMessage,
      addParticipant,
      removeParticipant,
      startDraftThread,
      discardDraft,
    ],
  );

  return (
    <MessagingStoreContext.Provider value={value}>
      {children}
    </MessagingStoreContext.Provider>
  );
}

export function useMessagingStore(): MessagingStoreValue {
  const ctx = useContext(MessagingStoreContext);
  if (!ctx) {
    throw new Error(
      "useMessagingStore must be used inside <MessagingStoreProvider>",
    );
  }
  return ctx;
}
