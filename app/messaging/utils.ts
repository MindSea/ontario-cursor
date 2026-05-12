import type {
  Conversation,
  DirectoryPerson,
  Message,
  ParticipantKind,
  ParticipantRef,
} from "./types";

export function toParticipantRef(person: DirectoryPerson): ParticipantRef {
  return { kind: person.kind, personId: person.id };
}

/** Stable key for a direct thread between two distinct people (order-independent). */
export function directConversationKey(a: ParticipantRef, b: ParticipantRef): string {
  const x = `${a.kind}:${a.personId}`;
  const y = `${b.kind}:${b.personId}`;
  return x < y ? `${x}|${y}` : `${y}|${x}`;
}

export function participantRefEquals(a: ParticipantRef, b: ParticipantRef): boolean {
  return a.kind === b.kind && a.personId === b.personId;
}

export function findDirectConversation(
  conversations: readonly Conversation[],
  a: ParticipantRef,
  b: ParticipantRef,
  excludeConversationId?: string,
): Conversation | undefined {
  const key = directConversationKey(a, b);
  return conversations.find((c) => {
    if (c.id === excludeConversationId) return false;
    if (c.isDraft) return false;
    if (c.type !== "direct" || c.participants.length !== 2) return false;
    const [p, q] = c.participants;
    return directConversationKey(p, q) === key;
  });
}

/** Navigators and PCPs may start new conversations; patients may only reply in existing ones. */
export function canStartNewThread(actor: DirectoryPerson): boolean {
  return actor.kind === "navigator" || actor.kind === "pcp";
}

export function isParticipantInConversation(
  conv: Conversation,
  person: DirectoryPerson,
): boolean {
  return conv.participants.some(
    (p) => p.kind === person.kind && p.personId === person.id,
  );
}

export function buildDirectoryLookup(
  directory: readonly DirectoryPerson[],
): Map<string, DirectoryPerson> {
  return new Map(directory.map((p) => [`${p.kind}:${p.id}`, p]));
}

export function displayNameFor(
  directoryByKey: Map<string, DirectoryPerson>,
  ref: ParticipantRef,
): string {
  return (
    directoryByKey.get(`${ref.kind}:${ref.personId}`)?.displayName ?? "Unknown"
  );
}

/**
 * No custom thread titles — list everyone in the thread. The signed-in person
 * (viewer) is listed first when they are a participant; others follow A→Z by name.
 */
export function formatThreadParticipantList(
  conv: Conversation,
  directoryByKey: Map<string, DirectoryPerson>,
  viewer: DirectoryPerson | null,
): string {
  const me = viewer ? toParticipantRef(viewer) : null;
  const refs = [...conv.participants];
  refs.sort((a, b) => {
    if (me) {
      const aSelf = participantRefEquals(a, me);
      const bSelf = participantRefEquals(b, me);
      if (aSelf && !bSelf) return -1;
      if (!aSelf && bSelf) return 1;
    }
    return displayNameFor(directoryByKey, a).localeCompare(
      displayNameFor(directoryByKey, b),
      undefined,
      { sensitivity: "base" },
    );
  });
  const names = refs.map((p) => displayNameFor(directoryByKey, p));
  return names.length > 0 ? names.join(", ") : "Conversation";
}

export function roleBadgeLabel(kind: ParticipantKind): string {
  switch (kind) {
    case "navigator":
      return "Navigator";
    case "patient":
      return "Patient";
    case "pcp":
      return "PCP";
  }
}

export function sortMessagesAsc(messages: readonly Message[]): Message[] {
  return [...messages].sort(
    (x, y) => new Date(x.sentAt).getTime() - new Date(y.sentAt).getTime(),
  );
}

export function newMessageId(): string {
  return `msg-${globalThis.crypto?.randomUUID?.() ?? String(Date.now())}`;
}

export function newConversationId(): string {
  return `conv-${globalThis.crypto?.randomUUID?.() ?? String(Date.now())}`;
}

export function participantSetKey(participants: readonly ParticipantRef[]): string {
  return [...participants]
    .map((p) => `${p.kind}:${p.personId}`)
    .sort()
    .join("|");
}

export function dedupeParticipantRefs(
  refs: readonly ParticipantRef[],
): ParticipantRef[] {
  const seen = new Set<string>();
  const out: ParticipantRef[] = [];
  for (const r of refs) {
    const k = `${r.kind}:${r.personId}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

export function findGroupWithParticipantSet(
  conversations: readonly Conversation[],
  participants: readonly ParticipantRef[],
  excludeConversationId?: string,
): Conversation | undefined {
  const key = participantSetKey(participants);
  return conversations.find((c) => {
    if (c.id === excludeConversationId) return false;
    if (c.isDraft) return false;
    return c.type === "group" && participantSetKey(c.participants) === key;
  });
}
