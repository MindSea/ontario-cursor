"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { conversationReadyToMessage } from "@/app/messaging/messaging-conversation-logic";
import { MessagingInbox } from "@/app/messaging/messaging-inbox";
import { useMessagingStore } from "@/app/messaging/messaging-store";
import { MessagingThread } from "@/app/messaging/messaging-thread";
import type { ParticipantRef } from "@/app/messaging/types";
import { isParticipantInConversation } from "@/app/messaging/utils";
import { cn } from "@/lib/utils";

import { conversationLastActivityMs } from "./patient-profile-demo-data";
import { conversationsForPatient } from "./queries";

/**
 * In-profile Conversations UI. Mirrors the `/messaging` page split (inbox on
 * the left, thread on the right) but is scoped to the conversations that
 * include this patient.
 *
 * Reads + writes from the application-wide `MessagingStoreProvider`, so
 * messages sent here are visible under `/messaging`, and threads created
 * via "New conversation" here show up on `/messaging` too.
 *
 * Only UI state (active conversation id, mobile two-pane state) is kept
 * local. The parent (`PatientProfileView`) keeps this component mounted
 * across tab switches and uses CSS (`hidden`) to hide it when another
 * section is active, so the active conversation / mobile pane survive the
 * switch.
 */
export type PatientConversationsPanelProps = {
  patientId: string;
};

export function PatientConversationsPanel({
  patientId,
}: PatientConversationsPanelProps) {
  const store = useMessagingStore();
  const {
    conversations: allConversations,
    messages,
    directory,
    currentUser,
    rosterEditable,
    sendMessage,
    editMessage,
    deleteMessage,
    addParticipant,
    removeParticipant,
    startDraftThread,
    discardDraft,
  } = store;

  /* Filtered + sorted view of the store. Recomputes whenever the store
   * changes (e.g. a new message changes last-activity ordering, or this
   * panel starts a draft that's keyed off the patient). */
  const conversations = useMemo(() => {
    return [...conversationsForPatient(allConversations, patientId)].sort(
      (a, b) =>
        conversationLastActivityMs(b.id, messages) -
        conversationLastActivityMs(a.id, messages),
    );
  }, [allConversations, messages, patientId]);

  /* `selectedId` is the user's intent. `activeId` is what we actually
   * render — derived from `selectedId` and the *current filtered*
   * `conversations`. If the user's pick got merged away or removed from
   * the patient's threads, we fall back to the first available
   * conversation without calling setState inside an effect (avoids a
   * cascading render). */
  const [selectedId, setSelectedId] = useState<string | null>(
    () => conversations[0]?.id ?? null,
  );
  const activeId = useMemo<string | null>(() => {
    if (selectedId && conversations.some((c) => c.id === selectedId)) {
      return selectedId;
    }
    return conversations[0]?.id ?? null;
  }, [selectedId, conversations]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [isMd, setIsMd] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsMd(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const selectConversation = useCallback(
    (id: string) => {
      setSelectedId(id);
      if (!isMd) setMobileShowThread(true);
    },
    [isMd],
  );

  const handleStartDraft = useCallback(() => {
    /* Pre-seed the patient as a participant — the whole point of starting
     * a thread from inside the profile is that the patient is the subject.
     * The navigator (currentUser) is always added automatically by the
     * store. */
    const patientRef: ParticipantRef = { kind: "patient", personId: patientId };
    const id = startDraftThread([patientRef]);
    setSelectedId(id);
    if (!isMd) setMobileShowThread(true);
  }, [patientId, startDraftThread, isMd]);

  const handleDiscardDraft = useCallback(() => {
    if (!activeId) return;
    discardDraft(activeId);
  }, [activeId, discardDraft]);

  /* Only navigators / PCPs can start threads. The button lives inside
   * `MessagingInbox` and is gated by whether we pass `onStartNewThread`,
   * so the inbox stays role-agnostic. */
  const canStart = currentUser.kind !== "patient" && rosterEditable;

  /* Lock the profile's patient on every draft started here — they're the
   * implicit subject of any conversation initiated from inside the
   * profile, so their chip never offers an X while the draft is pending.
   * Once the draft commits, the standard remove rules take over. */
  const lockedParticipantRef = useMemo<ParticipantRef>(
    () => ({ kind: "patient", personId: patientId }),
    [patientId],
  );

  return (
    /* Outer wrapper mirrors /messaging's body padding so the thread frame
     * lands at the same offsets in both surfaces:
     *   - Desktop: capped at max-w-6xl with `px-8 + py-4`, same as
     *     /messaging.
     *   - Mobile: `max-md:pt-1 max-md:pb-3` matches /messaging's body
     *     (a 4px top breathing slice between the dialog's tab nav and the
     *     thread chrome). Without it the thread header sat flush against
     *     the tab nav's border on mobile, which made the back chevron in
     *     the thread title row feel cramped versus /messaging.
     *     Horizontal padding stays 0 — the inbox/thread group is
     *     full-bleed on mobile in both surfaces. */
    <div
      className={cn(
        "flex min-h-0 w-full min-w-0 flex-1 flex-col",
        "max-md:px-0 max-md:pt-1 max-md:pb-3",
        "md:mx-auto md:max-w-6xl md:px-8 md:py-4",
      )}
    >
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-0 overflow-hidden md:flex-row",
          "max-md:rounded-none max-md:border-0",
          "md:rounded-lg md:border md:border-border/60",
        )}
      >
        <div
          className={cn(
            /* Same basis as /messaging (22rem) so the thread column lands
             * at the same width, which keeps `max-w-3xl` from kicking in
             * and adding visible extra padding around messages. */
            "flex min-h-0 w-full min-w-0 flex-col overflow-hidden md:shrink-0 md:grow-0 md:basis-[min(100%,22rem)] md:max-w-[min(100%,22rem)]",
            !isMd && mobileShowThread && "hidden",
          )}
        >
          <MessagingInbox
            conversations={conversations}
            messages={messages}
            directory={directory}
            currentUser={currentUser}
            activeId={activeId}
            onSelectConversation={selectConversation}
            /* Inbox owns the "New conversation" button. Hidden on mobile
             * thread view automatically because the column itself is
             * `hidden` then. */
            onStartNewThread={canStart ? handleStartDraft : undefined}
          />
        </div>

        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:min-w-0",
            !isMd && !mobileShowThread && "hidden",
            isMd && "border-border/60 md:border-l",
          )}
        >
          <MessagingThread
            conversation={activeConversation}
            messages={messages}
            currentUser={currentUser}
            directory={directory}
            showMobileBack={!isMd && mobileShowThread}
            onMobileBack={() => setMobileShowThread(false)}
            onSend={(body) => {
              if (!activeId) return;
              sendMessage(activeId, body);
            }}
            onEditMessage={editMessage}
            onDeleteMessage={deleteMessage}
            canSend={
              activeConversation != null &&
              conversationReadyToMessage(activeConversation) &&
              (currentUser.kind !== "patient" ||
                isParticipantInConversation(activeConversation, currentUser))
            }
            rosterEditable={rosterEditable}
            onAddParticipant={(person) => {
              if (!activeId) return;
              addParticipant(activeId, person);
            }}
            onRemoveParticipant={(ref: ParticipantRef) => {
              if (!activeId) return;
              removeParticipant(activeId, ref);
            }}
            onDiscardDraft={
              activeConversation?.isDraft && rosterEditable
                ? handleDiscardDraft
                : undefined
            }
            lockedParticipantRef={lockedParticipantRef}
          />
        </div>
      </div>
    </div>
  );
}
