export type ParticipantKind = "navigator" | "patient" | "pcp";

export type ConversationType = "direct" | "group";

/** Person in the shared directory (navigators, patients, PCPs). */
export type DirectoryPerson = {
  id: string;
  kind: ParticipantKind;
  displayName: string;
};

export type ParticipantRef = {
  kind: ParticipantKind;
  personId: string;
};

export type Conversation = {
  id: string;
  type: ConversationType;
  title?: string | null;
  createdAt: string;
  participants: ParticipantRef[];
  /**
   * Option B: thread row exists immediately; cleared after the first user message
   * (system lines do not count).
   */
  isDraft?: boolean;
};

export type MessageVariant = "user" | "system";

export type Message = {
  id: string;
  conversationId: string;
  senderKind: ParticipantKind;
  senderId: string;
  body: string;
  sentAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  /** Slack-style roster / meta lines (centered, no edit). */
  variant?: MessageVariant;
};
