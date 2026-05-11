import type { Conversation, DirectoryPerson, Message } from "./types";

/** Demo persona — navigators message as Anna. */
export const CURRENT_USER_ID = "nav-anna";

export function buildDirectory(): DirectoryPerson[] {
  return [
    { id: "nav-anna", kind: "navigator", displayName: "Anna" },
    { id: "nav-marcus", kind: "navigator", displayName: "Marcus" },
    { id: "nav-jordan", kind: "navigator", displayName: "Jordan" },
    { id: "nav-riley", kind: "navigator", displayName: "Riley" },
    { id: "pat-robert", kind: "patient", displayName: "Robert Chen" },
    { id: "pat-linda", kind: "patient", displayName: "Linda Wu" },
    { id: "pat-james", kind: "patient", displayName: "James Okafor" },
    { id: "pcp-ellis", kind: "pcp", displayName: "Dr. Ellis" },
    { id: "pcp-patel", kind: "pcp", displayName: "Dr. Patel" },
    { id: "pcp-nguyen", kind: "pcp", displayName: "Dr. Nguyen" },
  ];
}

export function buildSeedConversations(): Conversation[] {
  return [
    {
      id: "conv-d-anna-marcus",
      type: "direct",
      title: null,
      createdAt: "2026-05-02T14:00:00.000Z",
      participants: [
        { kind: "navigator", personId: "nav-anna" },
        { kind: "navigator", personId: "nav-marcus" },
      ],
    },
    {
      id: "conv-d-anna-robert",
      type: "direct",
      title: null,
      createdAt: "2026-05-05T09:30:00.000Z",
      participants: [
        { kind: "navigator", personId: "nav-anna" },
        { kind: "patient", personId: "pat-robert" },
      ],
    },
    {
      id: "conv-d-anna-ellis",
      type: "direct",
      title: null,
      createdAt: "2026-05-06T11:15:00.000Z",
      participants: [
        { kind: "navigator", personId: "nav-anna" },
        { kind: "pcp", personId: "pcp-ellis" },
      ],
    },
    /** Anna + James (patient replies only after being in thread) */
    {
      id: "conv-d-james-anna",
      type: "direct",
      title: null,
      createdAt: "2026-05-08T08:45:00.000Z",
      participants: [
        { kind: "patient", personId: "pat-james" },
        { kind: "navigator", personId: "nav-anna" },
      ],
    },
    /** Ad-hoc navigator group */
    {
      id: "conv-g-nav-huddle",
      type: "group",
      title: null,
      createdAt: "2026-05-07T16:00:00.000Z",
      participants: [
        { kind: "navigator", personId: "nav-anna" },
        { kind: "navigator", personId: "nav-jordan" },
        { kind: "navigator", personId: "nav-marcus" },
      ],
    },
    /** Care team group (participants listed in UI; no custom title in V1) */
    {
      id: "conv-g-care-linda",
      type: "group",
      title: null,
      createdAt: "2026-05-04T13:20:00.000Z",
      participants: [
        { kind: "navigator", personId: "nav-anna" },
        { kind: "patient", personId: "pat-linda" },
        { kind: "pcp", personId: "pcp-patel" },
        { kind: "navigator", personId: "nav-riley" },
      ],
    },
    /** Navigator sync group */
    {
      id: "conv-g-monthly-sync",
      type: "group",
      title: null,
      createdAt: "2026-05-01T15:00:00.000Z",
      participants: [
        { kind: "pcp", personId: "pcp-nguyen" },
        { kind: "navigator", personId: "nav-anna" },
        { kind: "navigator", personId: "nav-riley" },
        { kind: "navigator", personId: "nav-jordan" },
      ],
    },
  ];
}

export function buildSeedMessages(): Message[] {
  return [
    /* Anna ↔ Marcus */
    {
      id: "msg-1",
      conversationId: "conv-d-anna-marcus",
      senderKind: "navigator",
      senderId: "nav-marcus",
      body: "Morning — did Linda’s transportation get confirmed for Thursday?",
      sentAt: "2026-05-10T13:05:00.000Z",
    },
    {
      id: "msg-2",
      conversationId: "conv-d-anna-marcus",
      senderKind: "navigator",
      senderId: "nav-anna",
      body: "Yes, curb pickup at 9:20. I left a note in Clinic Flow.",
      sentAt: "2026-05-10T13:08:00.000Z",
    },
    /* Anna ↔ Robert */
    {
      id: "msg-3",
      conversationId: "conv-d-anna-robert",
      senderKind: "navigator",
      senderId: "nav-anna",
      body: "Hi Robert — following up on the forms we emailed. Let me know if you want help with the portal.",
      sentAt: "2026-05-09T10:00:00.000Z",
    },
    {
      id: "msg-4",
      conversationId: "conv-d-anna-robert",
      senderKind: "patient",
      senderId: "pat-robert",
      body: "Thanks Anna. I’ll log in tonight after work.",
      sentAt: "2026-05-09T18:22:00.000Z",
    },
    /* Anna ↔ Dr. Ellis */
    {
      id: "msg-5",
      conversationId: "conv-d-anna-ellis",
      senderKind: "pcp",
      senderId: "pcp-ellis",
      body: "If you see Robert before Tuesday, please remind him fasting labs.",
      sentAt: "2026-05-10T07:40:00.000Z",
    },
    {
      id: "msg-6",
      conversationId: "conv-d-anna-ellis",
      senderKind: "navigator",
      senderId: "nav-anna",
      body: "Will do — I’ll confirm when I connect with him this afternoon.",
      sentAt: "2026-05-10T07:55:00.000Z",
      editedAt: "2026-05-10T08:02:00.000Z",
    },
    /* James thread: navigator first */
    {
      id: "msg-7",
      conversationId: "conv-d-james-anna",
      senderKind: "navigator",
      senderId: "nav-anna",
      body: "Hi James — confirming tomorrow at 10. Reply here if you need parking details.",
      sentAt: "2026-05-10T11:30:00.000Z",
    },
    {
      id: "msg-8",
      conversationId: "conv-d-james-anna",
      senderKind: "patient",
      senderId: "pat-james",
      body: "Thanks — I’m not sure I understood the parking instructions. Which entrance should I use?",
      sentAt: "2026-05-10T11:42:00.000Z",
    },
    {
      id: "msg-8b",
      conversationId: "conv-d-james-anna",
      senderKind: "navigator",
      senderId: "nav-anna",
      body: "Use the west entrance off Elm; validation desk is just inside. I’ll meet you there at 10.",
      sentAt: "2026-05-10T11:48:00.000Z",
    },
    /* Navigator huddle group */
    {
      id: "msg-9",
      conversationId: "conv-g-nav-huddle",
      senderKind: "navigator",
      senderId: "nav-jordan",
      body: "Anyone free to cover intake shadow tomorrow 2–3?",
      sentAt: "2026-05-08T15:10:00.000Z",
    },
    {
      id: "msg-10",
      conversationId: "conv-g-nav-huddle",
      senderKind: "navigator",
      senderId: "nav-anna",
      body: "I can be there — ping me if plans shift.",
      sentAt: "2026-05-08T15:18:00.000Z",
    },
    {
      id: "msg-11",
      conversationId: "conv-g-nav-huddle",
      senderKind: "navigator",
      senderId: "nav-marcus",
      body: "Same — happy to swap if someone gets pulled to transport.",
      sentAt: "2026-05-08T15:22:00.000Z",
      deletedAt: "2026-05-08T15:45:00.000Z",
    },
    /* Care team group */
    {
      id: "msg-12",
      conversationId: "conv-g-care-linda",
      senderKind: "navigator",
      senderId: "nav-anna",
      body: "Team — Linda asked for a single point of contact for cardiology scheduling. I’ll own follow-ups unless anyone objects.",
      sentAt: "2026-05-07T09:00:00.000Z",
    },
    {
      id: "msg-13",
      conversationId: "conv-g-care-linda",
      senderKind: "pcp",
      senderId: "pcp-patel",
      body: "Sounds good. Please loop me if wait times slip past two weeks.",
      sentAt: "2026-05-07T09:05:00.000Z",
    },
    {
      id: "msg-14",
      conversationId: "conv-g-care-linda",
      senderKind: "patient",
      senderId: "pat-linda",
      body: "Thank you both — that helps a lot.",
      sentAt: "2026-05-07T09:12:00.000Z",
    },
    {
      id: "msg-15",
      conversationId: "conv-g-care-linda",
      senderKind: "navigator",
      senderId: "nav-riley",
      body: "I’ll tag visits if I pick up anything from intake.",
      sentAt: "2026-05-07T09:18:00.000Z",
    },
    /* Monthly sync */
    {
      id: "msg-16",
      conversationId: "conv-g-monthly-sync",
      senderKind: "pcp",
      senderId: "pcp-nguyen",
      body: "Quick agenda for Friday: panel metrics, then open Q&A on referrals.",
      sentAt: "2026-05-06T14:00:00.000Z",
    },
    {
      id: "msg-17",
      conversationId: "conv-g-monthly-sync",
      senderKind: "navigator",
      senderId: "nav-anna",
      body: "Can we add 5 minutes for parking feedback from patients? Heard it twice this week.",
      sentAt: "2026-05-06T14:06:00.000Z",
    },
    {
      id: "msg-18",
      conversationId: "conv-g-monthly-sync",
      senderKind: "navigator",
      senderId: "nav-jordan",
      body: "+1 — I’ll bring examples from yesterday’s visits.",
      sentAt: "2026-05-06T14:08:00.000Z",
    },
  ];
}

export function buildMessagingSeed(): {
  directory: DirectoryPerson[];
  conversations: Conversation[];
  messages: Message[];
} {
  return {
    directory: buildDirectory(),
    conversations: buildSeedConversations(),
    messages: buildSeedMessages(),
  };
}
