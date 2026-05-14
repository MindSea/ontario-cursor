"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { textBody } from "@/lib/typography";
import { cn } from "@/lib/utils";

import { conversationReadyToMessage } from "./messaging-conversation-logic";
import { MessagingInbox } from "./messaging-inbox";
import { MessagingThread } from "./messaging-thread";
import { useMessagingStore } from "./messaging-store";
import { PatientProfileDialog } from "@/app/patient-profile/patient-profile-dialog";
import { usePatientProfileUrlState } from "@/app/patient-profile/use-patient-profile-url-state";
import type { ParticipantRef } from "./types";
import {
  canStartNewThread,
  isParticipantInConversation,
} from "./utils";

export default function MessagingPage() {
  /* All conversation / message state lives in the shared store now, so
   * edits made here are also visible inside the patient profile dialog
   * (and vice versa). Only UI state — active conversation id, the mobile
   * two-pane toggle — stays local. */
  const store = useMessagingStore();
  const {
    conversations,
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

  /* `selectedId` is the user's intent (last conversation they picked).
   * `activeId` is what we actually render — derived from `selectedId` and
   * the current `conversations`. If the user's pick got merged away (e.g.
   * adding a participant converged this thread into an existing one) or
   * never existed, we fall back to the first available conversation
   * without writing through `setState` in an effect, which avoids a
   * cascading render. */
  const [selectedId, setSelectedId] = useState<string | null>(
    () => conversations[0]?.id ?? null,
  );
  const activeId = useMemo<string | null>(() => {
    if (selectedId && conversations.some((c) => c.id === selectedId)) {
      return selectedId;
    }
    return conversations[0]?.id ?? null;
  }, [selectedId, conversations]);

  const [isMd, setIsMd] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsMd(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const [mobileShowThread, setMobileShowThread] = useState(false);
  const patientProfile = usePatientProfileUrlState();

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const handleStartDraft = useCallback(() => {
    const id = startDraftThread();
    setSelectedId(id);
    if (!isMd) setMobileShowThread(true);
  }, [startDraftThread, isMd]);

  const handleDiscardDraft = useCallback(() => {
    if (!activeId) return;
    discardDraft(activeId);
  }, [activeId, discardDraft]);

  const selectConversation = useCallback(
    (id: string) => {
      setSelectedId(id);
      if (!isMd) setMobileShowThread(true);
    },
    [isMd],
  );

  const showNewThread = canStartNewThread(currentUser);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col bg-background text-foreground",
        "max-md:fixed max-md:inset-0 max-md:z-0 max-md:h-dvh max-md:max-h-dvh max-md:overflow-hidden max-md:overscroll-none",
        "md:static md:z-auto md:h-full",
      )}
    >
      {/* Mobile: shell fills viewport (Clinic Flow pattern); headers are shrink-0, body scrolls inside. */}
      <div
        className={cn(
          "w-full shrink-0 border-b border-border/50 bg-background max-md:border-border/60",
          "md:sticky md:top-0 md:z-30",
        )}
      >
        {/* Match AppShell / Clinic Flow: one h-12 bar; horizontal padding only (vertical = fixed height + items-center). */}
        <div className="max-md:pt-[env(safe-area-inset-top)]">
          <div
            className={cn(
              "flex h-12 w-full min-w-0 shrink-0 items-center gap-2 px-3",
              "md:mx-auto md:max-w-6xl md:gap-2 md:px-8",
              textBody,
            )}
          >
            {/* Same 36px leading column as thread back control so titles and icons line up on mobile. */}
            <div className="flex w-9 shrink-0 items-center justify-center">
              <SidebarTrigger className="shrink-0" />
            </div>
            <h1 className="min-w-0 flex-1 truncate text-lg font-semibold leading-tight tracking-tight">
              Messaging
            </h1>
            {/* "New conversation" lives inside `MessagingInbox` now (above
             * the conversation list), so it auto-hides on mobile when the
             * user drills into a thread. The page header is just title +
             * sidebar trigger. */}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden",
          "max-md:px-0 max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          "max-md:pt-1 max-md:pb-3 md:py-4",
          "md:mx-auto md:max-w-6xl md:px-8",
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
              onStartNewThread={showNewThread ? handleStartDraft : undefined}
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
              onOpenPatientProfile={patientProfile.open}
            />
          </div>
        </div>
      </div>
      <PatientProfileDialog
        patientId={patientProfile.patientId}
        section={patientProfile.section}
        onSectionChange={patientProfile.setSection}
        onRequestClose={patientProfile.close}
      />
    </div>
  );
}
