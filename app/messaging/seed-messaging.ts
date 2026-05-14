import {
  PATIENT_DAVID_MILLER,
  PATIENT_ELENA_RODRIGUEZ,
  PATIENT_EVELYN_HART,
  PATIENT_HELEN_PARK,
  PATIENT_JAMES_OKAFOR,
  PATIENT_JAMES_WILSON,
  PATIENT_LINDA_WU,
  PATIENT_MARIA_GARCIA,
  PATIENT_ROBERT_CHEN,
  PATIENT_SAMUEL_LEE,
  PATIENT_SARAH_JENKINS,
} from "@/app/patient-profile/patient-ids";

import type { Conversation, DirectoryPerson, Message } from "./types";

/** Demo persona — navigators message as Anna. */
export const CURRENT_USER_ID = "nav-anna";

export function buildDirectory(): DirectoryPerson[] {
  return [
    { id: "nav-anna", kind: "navigator", displayName: "Anna" },
    { id: "nav-marcus", kind: "navigator", displayName: "Marcus" },
    { id: "nav-jordan", kind: "navigator", displayName: "Jordan" },
    { id: "nav-riley", kind: "navigator", displayName: "Riley" },
    /* Patients: ids align with `Appointment.patientId` + patient profile seed (`pat-*`). */
    { id: PATIENT_DAVID_MILLER, kind: "patient", displayName: "David Miller" },
    { id: PATIENT_ELENA_RODRIGUEZ, kind: "patient", displayName: "Elena Rodriguez" },
    { id: PATIENT_EVELYN_HART, kind: "patient", displayName: "Evelyn Hart" },
    { id: PATIENT_HELEN_PARK, kind: "patient", displayName: "Helen Park" },
    { id: PATIENT_JAMES_OKAFOR, kind: "patient", displayName: "James Okafor" },
    { id: PATIENT_JAMES_WILSON, kind: "patient", displayName: "James Wilson" },
    { id: PATIENT_LINDA_WU, kind: "patient", displayName: "Linda Wu" },
    { id: PATIENT_MARIA_GARCIA, kind: "patient", displayName: "Maria Garcia" },
    { id: PATIENT_ROBERT_CHEN, kind: "patient", displayName: "Robert Chen" },
    { id: PATIENT_SAMUEL_LEE, kind: "patient", displayName: "Samuel Lee" },
    { id: PATIENT_SARAH_JENKINS, kind: "patient", displayName: "Sarah Jenkins" },
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
    /** Monthly sync group */
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
    /** Anna + Sarah (CHF follow-up coordination) */
    {
      id: "conv-d-anna-sarah",
      type: "direct",
      title: null,
      createdAt: "2026-05-03T10:00:00.000Z",
      participants: [
        { kind: "navigator", personId: "nav-anna" },
        { kind: "patient", personId: PATIENT_SARAH_JENKINS },
      ],
    },
    /** Jordan + Elena (acute visit check-in) */
    {
      id: "conv-d-jordan-elena",
      type: "direct",
      title: null,
      createdAt: "2026-05-04T12:00:00.000Z",
      participants: [
        { kind: "navigator", personId: "nav-jordan" },
        { kind: "patient", personId: PATIENT_ELENA_RODRIGUEZ },
      ],
    },
    /** Marcus + David (immunization / allergy flags) */
    {
      id: "conv-d-marcus-david",
      type: "direct",
      title: null,
      createdAt: "2026-05-05T16:30:00.000Z",
      participants: [
        { kind: "navigator", personId: "nav-marcus" },
        { kind: "patient", personId: PATIENT_DAVID_MILLER },
      ],
    },
    /** Small care team around Maria */
    {
      id: "conv-g-maria-care",
      type: "group",
      title: null,
      createdAt: "2026-05-02T09:00:00.000Z",
      participants: [
        { kind: "navigator", personId: "nav-anna" },
        { kind: "patient", personId: PATIENT_MARIA_GARCIA },
        { kind: "pcp", personId: "pcp-nguyen" },
      ],
    },
    /** Riley + James Wilson (HTN visit logistics) */
    {
      id: "conv-d-riley-james-wilson",
      type: "direct",
      title: null,
      createdAt: "2026-05-09T14:00:00.000Z",
      participants: [
        { kind: "navigator", personId: "nav-riley" },
        { kind: "patient", personId: PATIENT_JAMES_WILSON },
      ],
    },
    /** Anna + Helen (medication review follow-up) */
    {
      id: "conv-d-anna-helen",
      type: "direct",
      title: null,
      createdAt: "2026-05-08T09:15:00.000Z",
      participants: [
        { kind: "navigator", personId: "nav-anna" },
        { kind: "patient", personId: PATIENT_HELEN_PARK },
      ],
    },
    /** Riley + Evelyn (wellness prep) */
    {
      id: "conv-d-riley-evelyn",
      type: "direct",
      title: null,
      createdAt: "2026-05-07T11:00:00.000Z",
      participants: [
        { kind: "navigator", personId: "nav-riley" },
        { kind: "patient", personId: PATIENT_EVELYN_HART },
      ],
    },
    /** Marcus + Samuel (lab / INR logistics) */
    {
      id: "conv-d-marcus-samuel",
      type: "direct",
      title: null,
      createdAt: "2026-05-03T08:00:00.000Z",
      participants: [
        { kind: "navigator", personId: "nav-marcus" },
        { kind: "patient", personId: PATIENT_SAMUEL_LEE },
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
    /* Anna + Sarah */
    {
      id: "msg-19",
      conversationId: "conv-d-anna-sarah",
      senderKind: "navigator",
      senderId: "nav-anna",
      body: "Sarah — quick check on the cardiology echo paperwork. Do you want me to fax the release today?",
      sentAt: "2026-05-10T15:00:00.000Z",
    },
    {
      id: "msg-20",
      conversationId: "conv-d-anna-sarah",
      senderKind: "patient",
      senderId: PATIENT_SARAH_JENKINS,
      body: "Yes please — I can sign electronically if you send the link.",
      sentAt: "2026-05-10T15:22:00.000Z",
    },
    /* Jordan + Elena */
    {
      id: "msg-21",
      conversationId: "conv-d-jordan-elena",
      senderKind: "navigator",
      senderId: "nav-jordan",
      body: "Elena — bring your inhaler spacer if you have one; we’ll review technique at intake.",
      sentAt: "2026-05-09T12:10:00.000Z",
    },
    {
      id: "msg-22",
      conversationId: "conv-d-jordan-elena",
      senderKind: "patient",
      senderId: PATIENT_ELENA_RODRIGUEZ,
      body: "Will do. Should I arrive early for parking?",
      sentAt: "2026-05-09T12:18:00.000Z",
    },
    /* Marcus + David */
    {
      id: "msg-23",
      conversationId: "conv-d-marcus-david",
      senderKind: "navigator",
      senderId: "nav-marcus",
      body: "David — Dr. Ellis asked us to hold flu until we review the vaccine allergy note. I’ll meet you before shots.",
      sentAt: "2026-05-10T09:00:00.000Z",
    },
    {
      id: "msg-24",
      conversationId: "conv-d-marcus-david",
      senderKind: "patient",
      senderId: PATIENT_DAVID_MILLER,
      body: "Understood. I’ll bring the letter from the allergist.",
      sentAt: "2026-05-10T09:14:00.000Z",
    },
    /* Maria care team */
    {
      id: "msg-25",
      conversationId: "conv-g-maria-care",
      senderKind: "navigator",
      senderId: "nav-anna",
      body: "Maria — sharing this thread with Dr. Nguyen so we can align on records and next steps.",
      sentAt: "2026-05-08T10:00:00.000Z",
    },
    {
      id: "msg-26",
      conversationId: "conv-g-maria-care",
      senderKind: "pcp",
      senderId: "pcp-nguyen",
      body: "Thanks Anna. Maria, once outside records arrive we’ll book the follow-up.",
      sentAt: "2026-05-08T10:08:00.000Z",
    },
    {
      id: "msg-27",
      conversationId: "conv-g-maria-care",
      senderKind: "patient",
      senderId: PATIENT_MARIA_GARCIA,
      body: "Thank you both — I’ll upload what I have tonight.",
      sentAt: "2026-05-08T10:20:00.000Z",
    },
    /* Riley + James Wilson */
    {
      id: "msg-28",
      conversationId: "conv-d-riley-james-wilson",
      senderKind: "navigator",
      senderId: "nav-riley",
      body: "James — BP cuff batteries looked low last visit; bring the cuff if you can.",
      sentAt: "2026-05-10T08:30:00.000Z",
    },
    {
      id: "msg-29",
      conversationId: "conv-d-riley-james-wilson",
      senderKind: "patient",
      senderId: PATIENT_JAMES_WILSON,
      body: "Packed it — see you at the visit.",
      sentAt: "2026-05-10T08:35:00.000Z",
    },
    /* Anna + Helen */
    {
      id: "msg-30",
      conversationId: "conv-d-anna-helen",
      senderKind: "patient",
      senderId: PATIENT_HELEN_PARK,
      body: "Anna — can you confirm my aspirin dose after today’s med review?",
      sentAt: "2026-05-09T16:00:00.000Z",
    },
    {
      id: "msg-31",
      conversationId: "conv-d-anna-helen",
      senderKind: "navigator",
      senderId: "nav-anna",
      body: "Yes — 81 mg daily unless Dr. Patel changes it; I’ll recap in your after-visit summary.",
      sentAt: "2026-05-09T16:05:00.000Z",
    },
    /* Riley + Evelyn */
    {
      id: "msg-32",
      conversationId: "conv-d-riley-evelyn",
      senderKind: "navigator",
      senderId: "nav-riley",
      body: "Evelyn — wellness visit checklist is in the portal; ping me if any form won’t submit.",
      sentAt: "2026-05-08T11:00:00.000Z",
    },
    {
      id: "msg-33",
      conversationId: "conv-d-riley-evelyn",
      senderKind: "patient",
      senderId: PATIENT_EVELYN_HART,
      body: "Got it — all green except insurance card photo. Re-uploading now.",
      sentAt: "2026-05-08T11:12:00.000Z",
    },
    /* Marcus + Samuel */
    {
      id: "msg-34",
      conversationId: "conv-d-marcus-samuel",
      senderKind: "navigator",
      senderId: "nav-marcus",
      body: "Samuel — INR clinic asked for this week’s home readings if you have them.",
      sentAt: "2026-05-07T07:30:00.000Z",
    },
    {
      id: "msg-35",
      conversationId: "conv-d-marcus-samuel",
      senderKind: "patient",
      senderId: PATIENT_SAMUEL_LEE,
      body: "Sent a photo of my log sheet in reply here.",
      sentAt: "2026-05-07T07:45:00.000Z",
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
