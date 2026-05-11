import type { Conversation, DirectoryPerson, Message, ParticipantRef } from "./types";
import { dedupeParticipantRefs } from "./utils";

export const MIN_GROUP_SIZE = 3;
export const MIN_DIRECT_SIZE = 2;

export function canManageRoster(actor: DirectoryPerson): boolean {
  return actor.kind === "navigator" || actor.kind === "pcp";
}

export function conversationReadyToMessage(conv: Conversation): boolean {
  const n = conv.participants.length;
  if (n < MIN_DIRECT_SIZE) return false;
  if (conv.type === "direct") return n === MIN_DIRECT_SIZE;
  return n >= MIN_GROUP_SIZE;
}

/** First real user message clears draft (system lines do not). */
export function conversationAfterFirstUserMessage(
  conv: Conversation,
): Conversation {
  if (!conv.isDraft) return conv;
  return { ...conv, isDraft: false };
}

export function normalizeTypeForParticipantCount(
  conv: Conversation,
): Conversation {
  const refs = dedupeParticipantRefs(conv.participants);
  const n = refs.length;
  if (n <= 1) {
    return { ...conv, type: "group", participants: refs, isDraft: true };
  }
  if (n === 2) {
    return { ...conv, type: "direct", participants: refs };
  }
  return { ...conv, type: "group", participants: refs };
}

export function mergeConversationMessages(
  messages: readonly Message[],
  fromConversationId: string,
  toConversationId: string,
): Message[] {
  return messages.map((m) =>
    m.conversationId === fromConversationId
      ? { ...m, conversationId: toConversationId }
      : m,
  );
}
