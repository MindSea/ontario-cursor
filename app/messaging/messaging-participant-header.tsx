"use client";

import { Plus, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { textBody, textMeta } from "@/lib/typography";
import { cn } from "@/lib/utils";

import type { Conversation, DirectoryPerson, ParticipantRef } from "./types";
import {
  buildDirectoryLookup,
  displayNameFor,
  participantRefEquals,
  roleBadgeLabel,
  toParticipantRef,
} from "./utils";

export type MessagingParticipantHeaderProps = {
  conversation: Conversation;
  directory: readonly DirectoryPerson[];
  currentUser: DirectoryPerson;
  canManageRoster: boolean;
  onAddPerson: (person: DirectoryPerson) => void;
  onRemovePerson: (ref: ParticipantRef) => void;
  onDiscardDraft?: () => void;
};

export function MessagingParticipantHeader({
  conversation,
  directory,
  currentUser,
  canManageRoster,
  onAddPerson,
  onRemovePerson,
  onDiscardDraft,
}: MessagingParticipantHeaderProps) {
  const directoryByKey = useMemo(
    () => buildDirectoryLookup(directory),
    [directory],
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const addWrapRef = useRef<HTMLDivElement>(null);

  const inConversation = (p: DirectoryPerson) =>
    conversation.participants.some(
      (r) => r.kind === p.kind && r.personId === p.id,
    );

  const addCandidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return directory.filter((p) => {
      if (p.kind === currentUser.kind && p.id === currentUser.id) return false;
      if (inConversation(p)) return false;
      if (!q) return true;
      return p.displayName.toLowerCase().includes(q);
    });
  }, [directory, conversation.participants, currentUser, query]);

  const isSelf = (ref: ParticipantRef) =>
    ref.kind === currentUser.kind && ref.personId === currentUser.id;

  const showRemoveOnChip = (ref: ParticipantRef) => {
    if (!canManageRoster) return false;
    if (conversation.type === "direct" && conversation.participants.length === 2)
      return false;
    if (isSelf(ref)) return false;
    if (conversation.participants.length <= 2) return false;
    return true;
  };

  const meRef = useMemo(() => toParticipantRef(currentUser), [currentUser]);
  const orderedParticipants = useMemo(() => {
    const refs = [...conversation.participants];
    refs.sort((a, b) => {
      const aSelf = participantRefEquals(a, meRef);
      const bSelf = participantRefEquals(b, meRef);
      if (aSelf && !bSelf) return -1;
      if (!aSelf && bSelf) return 1;
      return displayNameFor(directoryByKey, a).localeCompare(
        displayNameFor(directoryByKey, b),
        undefined,
        { sensitivity: "base" },
      );
    });
    return refs;
  }, [conversation.participants, directoryByKey, meRef]);

  return (
    <div className="w-full shrink-0 border-b border-border/40 bg-muted/20">
      <div className="px-3 py-2.5 md:px-4">
        <div className="flex w-full flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {orderedParticipants.map((ref) => {
            const name = displayNameFor(directoryByKey, ref);
            const removable = showRemoveOnChip(ref);
            return (
              <span
                key={`${ref.kind}:${ref.personId}`}
                className={cn(
                  "inline-flex h-7 max-w-full items-center gap-0.5 rounded-full border border-border/60 bg-background text-sm leading-none shadow-sm",
                  /* px-3 on shell for chips without X; for removable chips, put pl on the label
                   * (not the outer flex) — iOS Safari can drop padding-left on the chip shell
                   * when a ghost Button sits in the same inline-flex row. */
                  removable ? "pr-0.5" : "px-3",
                )}
              >
                <span
                  className={cn(
                    "min-w-0 truncate font-medium",
                    removable && "pl-3",
                  )}
                >
                  {name}
                </span>
                {showRemoveOnChip(ref) ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                    aria-label={`Remove ${name}`}
                    onClick={() => onRemovePerson(ref)}
                  >
                    <X className="size-3" aria-hidden />
                  </Button>
                ) : null}
              </span>
            );
          })}

          {canManageRoster ? (
            <div className="relative inline-flex" ref={addWrapRef}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 rounded-full px-2.5 text-xs"
                aria-expanded={pickerOpen}
                onClick={() => {
                  setPickerOpen((o) => !o);
                  setQuery("");
                }}
              >
                <Plus className="size-3.5" aria-hidden />
                Add
              </Button>
              {pickerOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Close add people"
                    onClick={() => setPickerOpen(false)}
                  />
                  <div
                    className={cn(
                      "absolute left-0 top-full z-50 mt-1 flex w-[min(100vw-2rem,20rem)] flex-col rounded-lg border border-border bg-popover p-2 shadow-lg",
                      textBody,
                    )}
                  >
                    <Input
                      placeholder="Search people…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="mb-2 h-8"
                      autoFocus
                    />
                    <ul className="m-0 max-h-56 list-none overflow-y-auto overscroll-contain p-0">
                      {addCandidates.length === 0 ? (
                        <li className={cn("px-2 py-2 text-muted-foreground", textMeta)}>
                          No matches
                        </li>
                      ) : (
                        addCandidates.map((p) => (
                          <li key={`${p.kind}:${p.id}`}>
                            <button
                              type="button"
                              className="flex w-full min-w-0 items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted/70"
                              onClick={() => {
                                onAddPerson(p);
                                setPickerOpen(false);
                                setQuery("");
                              }}
                            >
                              <span className="min-w-0 truncate">{p.displayName}</span>
                              <Badge variant="secondary" className="shrink-0 text-[10px]">
                                {roleBadgeLabel(p.kind)}
                              </Badge>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

          {conversation.isDraft && onDiscardDraft ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={onDiscardDraft}
            >
              Discard draft
            </Button>
          ) : null}
        </div>
      </div>
      </div>
    </div>
  );
}
