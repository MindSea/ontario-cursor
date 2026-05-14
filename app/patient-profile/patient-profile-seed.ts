import type { PatientId, PatientProfileAggregate } from "./types";

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
} from "./patient-ids";

const ISO = (s: string) => s;

function row(p: PatientProfileAggregate): PatientProfileAggregate {
  return p;
}

const DEMO_PROFILES: readonly PatientProfileAggregate[] = [
  row({
    summary: {
      patientId: PATIENT_SARAH_JENKINS,
      displayName: "Sarah Jenkins",
      pcpDisplayName: "Dr. Ellis",
      navigatorDisplayName: "Anna",
    },
    demographics: {
      dateOfBirth: "1948-03-12",
      gender: "female",
    },
    panel: {
      conditions: [
        { id: "c-sj-1", label: "CHF (chronic)", isActive: true },
        { id: "c-sj-2", label: "Major depressive disorder", isActive: true },
        { id: "c-sj-3", label: "Osteoarthritis", isActive: true },
      ],
      tasks: [
        {
          id: "lt-sj-1",
          title: "Confirm cardiology echo report received",
          detail: "PCP asked to file outside-facility echo in chart.",
          source: "pcp",
          stage: "waiting_on_external",
          isPinned: true,
          dueDate: "2026-05-18",
          createdAt: ISO("2026-05-08T10:00:00.000Z"),
          updatedAt: ISO("2026-05-10T14:00:00.000Z"),
        },
      ],
    },
    contactAdmin: {
      mobilePhone: "(416) 555-0142",
      homePhone: "(416) 555-0198",
      email: "sarah.jenkins@example.com",
      homeAddress: "1200 Bloor St W\nToronto, ON M6H 1N4",
      primaryLanguage: "English",
      translationRequired: false,
      contactMethodPreference: "phone",
      emergencyContact: {
        name: "Mary Jenkins",
        relationship: "Daughter",
        phone: "(416) 555-0160",
      },
      pharmacyOfChoice: "Main Street Pharmacy",
      primaryInsurance: "Medicare with supplemental (Humana)",
    },
  }),
  row({
    summary: {
      patientId: PATIENT_ROBERT_CHEN,
      displayName: "Robert Chen",
      pcpDisplayName: "Dr. Aris",
      navigatorDisplayName: "Anna",
    },
    demographics: {
      dateOfBirth: "1945-10-02",
      gender: "male",
    },
    panel: {
      conditions: [
        { id: "c-rc-1", label: "Type 2 diabetes mellitus", isActive: true },
        { id: "c-rc-2", label: "Hypertension", isActive: true },
        { id: "c-rc-3", label: "Hyperlipidemia", isActive: true },
      ],
      tasks: [
        {
          id: "lt-rc-1",
          title: "Insulin refill coordination",
          detail: "Confirm pharmacy and copay before PCP signs new order.",
          source: "system",
          stage: "in_progress",
          isPinned: true,
          dueDate: "2026-05-13",
          createdAt: ISO("2026-05-09T12:00:00.000Z"),
          updatedAt: ISO("2026-05-10T09:15:00.000Z"),
        },
        {
          id: "lt-rc-2",
          title: "Fasting labs reminder",
          detail: "PCP wants CMP + A1C prior to next visit.",
          source: "pcp",
          stage: "waiting_on_patient",
          isPinned: false,
          dueDate: "2026-05-16",
          createdAt: ISO("2026-05-10T07:40:00.000Z"),
          updatedAt: ISO("2026-05-10T07:55:00.000Z"),
        },
        {
          id: "lt-rc-3",
          title: "Foot exam status",
          detail: "Confirm diabetic foot exam was done at last visit; book one if not.",
          source: "navigator",
          stage: "open",
          isPinned: false,
          createdByNavigatorId: "nav-anna",
          createdAt: ISO("2026-05-07T16:20:00.000Z"),
          updatedAt: ISO("2026-05-07T16:20:00.000Z"),
        },
        {
          id: "lt-rc-4",
          title: "Prior authorization — GLP-1",
          detail: "Submitted to Express Scripts on 4/22; approved 5/1.",
          source: "navigator",
          stage: "resolved",
          isPinned: false,
          createdByNavigatorId: "nav-anna",
          resolvedAt: ISO("2026-05-01T17:00:00.000Z"),
          createdAt: ISO("2026-04-18T11:00:00.000Z"),
          updatedAt: ISO("2026-05-01T17:00:00.000Z"),
        },
      ],
    },
    contactAdmin: {
      mobilePhone: "(416) 555-0120",
      homePhone: "",
      email: "robert.chen@example.com",
      homeAddress: "88 Spadina Ave, Unit 402\nToronto, ON M5V 2H2",
      primaryLanguage: "English",
      translationRequired: false,
      contactMethodPreference: "sms",
      emergencyContact: {
        name: "Michael Chen",
        relationship: "Son",
        phone: "(416) 555-0121",
      },
      pharmacyOfChoice: "CVS Pharmacy",
      primaryInsurance: "Medicare Advantage",
    },
  }),
  row({
    summary: {
      patientId: PATIENT_ELENA_RODRIGUEZ,
      displayName: "Elena Rodriguez",
      pcpDisplayName: "Dr. Kim",
      navigatorDisplayName: "Jordan",
    },
    demographics: { dateOfBirth: "1949-06-21", gender: "female" },
    panel: {
      conditions: [
        { id: "c-er-1", label: "COPD", isActive: true },
        { id: "c-er-2", label: "Asthma", isActive: true },
      ],
      tasks: [
        {
          id: "lt-er-1",
          title: "Home oxygen supplier paperwork",
          detail: "Waiting on rx + 30-day usage log from Lincare.",
          source: "navigator",
          stage: "waiting_on_external",
          isPinned: false,
          createdByNavigatorId: "nav-jordan",
          createdAt: ISO("2026-05-06T13:00:00.000Z"),
          updatedAt: ISO("2026-05-09T11:00:00.000Z"),
        },
      ],
    },
    contactAdmin: {
      mobilePhone: "(416) 555-0233",
      homePhone: "(416) 555-0234",
      email: "elena.rodriguez@example.com",
      homeAddress: "45 Roncesvalles Ave\nToronto, ON M6R 2M3",
      primaryLanguage: "Spanish",
      translationRequired: true,
      contactMethodPreference: "phone",
      emergencyContact: {
        name: "Carlos Rodriguez",
        relationship: "Spouse",
        phone: "(416) 555-0235",
      },
      pharmacyOfChoice: "Walgreens",
      primaryInsurance: "Medicare",
    },
  }),
  row({
    summary: {
      patientId: PATIENT_JAMES_WILSON,
      displayName: "James Wilson",
      pcpDisplayName: "Dr. Patel",
      navigatorDisplayName: "Riley",
    },
    demographics: { dateOfBirth: "1948-01-08", gender: "male" },
    panel: {
      conditions: [
        { id: "c-jw-1", label: "Hypertension", isActive: true },
        { id: "c-jw-2", label: "CKD stage 3a", isActive: true },
      ],
      tasks: [
        {
          id: "lt-jw-1",
          title: "BP medication list update",
          detail: "PCP asked to reconcile post-discharge med list with the chart before next visit.",
          source: "pcp",
          stage: "in_progress",
          isPinned: false,
          createdAt: ISO("2026-05-10T08:00:00.000Z"),
          updatedAt: ISO("2026-05-10T08:00:00.000Z"),
        },
      ],
    },
    contactAdmin: {
      mobilePhone: "(416) 555-0310",
      homePhone: "(416) 555-0311",
      email: "james.wilson@example.com",
      homeAddress: "2000 Jane St\nToronto, ON M9M 1A1",
      primaryLanguage: "English",
      translationRequired: false,
      contactMethodPreference: "portal",
      emergencyContact: {
        name: "James Wilson",
        relationship: "Self",
        phone: "(416) 555-0310",
      },
      pharmacyOfChoice: "",
      primaryInsurance: "Medicare with Medigap",
    },
  }),
  row({
    summary: {
      patientId: PATIENT_MARIA_GARCIA,
      displayName: "Maria Garcia",
      pcpDisplayName: "Dr. Nguyen",
      navigatorDisplayName: "Sam",
    },
    demographics: { dateOfBirth: "1942-11-30", gender: "female" },
    panel: {
      conditions: [
        { id: "c-mg-1", label: "Type 2 diabetes mellitus", isActive: true },
        { id: "c-mg-2", label: "Depression", isActive: true },
      ],
      tasks: [
        {
          id: "lt-mg-1",
          title: "Outside records request",
          detail: "PCP asked to pull cardiology notes from Mount Sinai before 5/20.",
          source: "pcp",
          stage: "open",
          isPinned: false,
          dueDate: "2026-05-11",
          createdAt: ISO("2026-05-05T15:00:00.000Z"),
          updatedAt: ISO("2026-05-05T15:00:00.000Z"),
        },
      ],
    },
    contactAdmin: {
      mobilePhone: "(416) 555-0404",
      homePhone: "",
      email: "maria.garcia@example.com",
      homeAddress: "500 Dundas St E\nToronto, ON M5A 3T6",
      primaryLanguage: "Spanish",
      translationRequired: true,
      contactMethodPreference: "phone",
      emergencyContact: {
        name: "Sofia Garcia",
        relationship: "Daughter",
        phone: "(416) 555-0405",
      },
      pharmacyOfChoice: "Community Health Pharmacy",
      primaryInsurance: "Medicare and Medicaid",
    },
  }),
  row({
    summary: {
      patientId: PATIENT_SAMUEL_LEE,
      displayName: "Samuel Lee",
      pcpDisplayName: "Dr. Aris",
      navigatorDisplayName: "Marcus",
    },
    demographics: { dateOfBirth: "1940-07-04", gender: "male" },
    panel: {
      conditions: [
        { id: "c-sl-1", label: "Atrial fibrillation", isActive: true },
        { id: "c-sl-2", label: "Hyperlipidemia", isActive: true },
      ],
      tasks: [
        {
          id: "lt-sl-1",
          title: "INR standing orders confirmation",
          detail: "AFib + warfarin patient missing standing INR order — open one before next refill.",
          source: "system",
          stage: "waiting_on_patient",
          isPinned: false,
          dueDate: "2026-05-14",
          createdAt: ISO("2026-05-08T09:00:00.000Z"),
          updatedAt: ISO("2026-05-08T09:00:00.000Z"),
        },
      ],
    },
    contactAdmin: {
      mobilePhone: "(416) 555-0505",
      homePhone: "(416) 555-0506",
      email: "samuel.lee@example.com",
      homeAddress: "77 Finch Ave W\nToronto, ON M2N 6H6",
      primaryLanguage: "English",
      translationRequired: false,
      contactMethodPreference: "phone",
      emergencyContact: { name: "", relationship: "", phone: "" },
      pharmacyOfChoice: "Rite Aid",
      primaryInsurance: "Medicare with supplemental (Anthem)",
    },
  }),
  row({
    summary: {
      patientId: PATIENT_LINDA_WU,
      displayName: "Linda Wu",
      pcpDisplayName: "Dr. Kim",
      navigatorDisplayName: "Anna",
    },
    demographics: { dateOfBirth: "1955-09-16", gender: "female" },
    panel: {
      conditions: [
        { id: "c-lw-1", label: "Post-operative follow-up", isActive: true },
        { id: "c-lw-2", label: "Hypertension", isActive: true },
      ],
      tasks: [
        {
          id: "lt-lw-1",
          title: "Single point of contact for cardiology scheduling",
          detail: "Navigator owning follow-ups per team thread.",
          source: "navigator",
          stage: "in_progress",
          isPinned: true,
          createdByNavigatorId: "nav-anna",
          createdAt: ISO("2026-05-07T09:00:00.000Z"),
          updatedAt: ISO("2026-05-07T09:12:00.000Z"),
        },
        {
          id: "lt-lw-2",
          title: "Transportation for Thursday visit",
          detail: "Booked Wheel-Trans pickup at 1:30 PM; confirmed with daughter.",
          source: "navigator",
          stage: "resolved",
          isPinned: false,
          createdByNavigatorId: "nav-anna",
          resolvedAt: ISO("2026-05-10T13:08:00.000Z"),
          createdAt: ISO("2026-05-09T10:00:00.000Z"),
          updatedAt: ISO("2026-05-10T13:08:00.000Z"),
        },
      ],
    },
    contactAdmin: {
      mobilePhone: "(416) 555-0606",
      homePhone: "(416) 555-0607",
      email: "linda.wu@example.com",
      homeAddress: "9 Yorkville Ave\nToronto, ON M4W 1L1",
      primaryLanguage: "English",
      translationRequired: false,
      contactMethodPreference: "email",
      emergencyContact: {
        name: "Peter Wu",
        relationship: "Spouse",
        phone: "(416) 555-0608",
      },
      pharmacyOfChoice: "Costco Pharmacy",
      primaryInsurance: "Medicare Advantage (Cigna)",
    },
  }),
  row({
    summary: {
      patientId: PATIENT_DAVID_MILLER,
      displayName: "David Miller",
      pcpDisplayName: "Dr. Ellis",
      navigatorDisplayName: "Marcus",
    },
    demographics: { dateOfBirth: "1940-05-05", gender: "male" },
    panel: {
      conditions: [
        { id: "c-dm-1", label: "Immunization review", isActive: true },
      ],
      tasks: [
        {
          id: "lt-dm-1",
          title: "Vaccine allergy documentation review",
          detail: "Conflicting allergy entries between portal and chart — needs reconciliation.",
          source: "system",
          stage: "in_progress",
          isPinned: false,
          dueDate: "2026-05-13",
          createdAt: ISO("2026-05-08T14:00:00.000Z"),
          updatedAt: ISO("2026-05-08T14:00:00.000Z"),
        },
      ],
    },
    contactAdmin: {
      mobilePhone: "(416) 555-0707",
      homePhone: "",
      email: "david.miller@example.com",
      homeAddress: "300 The East Mall\nEtobicoke, ON M9B 6B4",
      primaryLanguage: "English",
      translationRequired: false,
      contactMethodPreference: "phone",
      emergencyContact: {
        name: "Rachel Miller",
        relationship: "Daughter",
        phone: "(416) 555-0708",
      },
      pharmacyOfChoice: "CVS Pharmacy",
      primaryInsurance: "Medicare",
    },
  }),
  row({
    summary: {
      patientId: PATIENT_HELEN_PARK,
      displayName: "Helen Park",
      pcpDisplayName: "Dr. Patel",
      navigatorDisplayName: "Anna",
    },
    demographics: { dateOfBirth: "1950-01-11", gender: "female" },
    panel: {
      conditions: [{ id: "c-hp-1", label: "CAD (stable)", isActive: true }],
      tasks: [],
    },
    contactAdmin: {
      mobilePhone: "(416) 555-0808",
      homePhone: "(416) 555-0809",
      email: "helen.park@example.com",
      homeAddress: "1 Yonge St\nToronto, ON M5E 1E5",
      primaryLanguage: "English",
      translationRequired: false,
      contactMethodPreference: "sms",
      emergencyContact: {
        name: "Chris Park",
        relationship: "Son",
        phone: "(416) 555-0810",
      },
      pharmacyOfChoice: "Main Street Pharmacy",
      primaryInsurance: "Medicare",
    },
  }),
  row({
    summary: {
      patientId: PATIENT_EVELYN_HART,
      displayName: "Evelyn Hart",
      pcpDisplayName: "Dr. Nguyen",
      navigatorDisplayName: "Riley",
    },
    demographics: { dateOfBirth: "1943-04-22", gender: "female" },
    panel: {
      conditions: [{ id: "c-eh-1", label: "Medicare wellness", isActive: true }],
      tasks: [
        {
          id: "lt-eh-1",
          title: "Insurance card copy on file",
          detail: "Front + back of new BCBS card; old plan lapsed 4/30.",
          source: "navigator",
          stage: "open",
          isPinned: false,
          createdByNavigatorId: "nav-riley",
          createdAt: ISO("2026-05-11T10:00:00.000Z"),
          updatedAt: ISO("2026-05-11T10:00:00.000Z"),
        },
      ],
    },
    contactAdmin: {
      mobilePhone: "(416) 555-0909",
      homePhone: "",
      email: "evelyn.hart@example.com",
      homeAddress: "250 Fort York Blvd\nToronto, ON M5V 3K9",
      primaryLanguage: "English",
      translationRequired: false,
      contactMethodPreference: "phone",
      emergencyContact: { name: "", relationship: "", phone: "" },
      pharmacyOfChoice: "CVS Pharmacy",
      primaryInsurance: "Medicare",
    },
  }),
  row({
    summary: {
      patientId: PATIENT_JAMES_OKAFOR,
      displayName: "James Okafor",
      pcpDisplayName: "Dr. Patel",
      navigatorDisplayName: "Anna",
    },
    demographics: { dateOfBirth: "1952-04-18", gender: "male" },
    panel: {
      conditions: [{ id: "c-jo-1", label: "Type 2 diabetes mellitus", isActive: true }],
      tasks: [
        {
          id: "lt-jo-1",
          title: "Parking and entrance instructions",
          detail: "Sent garage map and main-entrance walk-through link via SMS.",
          source: "navigator",
          stage: "resolved",
          isPinned: false,
          createdByNavigatorId: "nav-anna",
          resolvedAt: ISO("2026-05-10T11:48:00.000Z"),
          createdAt: ISO("2026-05-10T11:30:00.000Z"),
          updatedAt: ISO("2026-05-10T11:48:00.000Z"),
        },
      ],
    },
    contactAdmin: {
      mobilePhone: "(416) 555-0991",
      homePhone: "",
      email: "james.okafor@example.com",
      homeAddress: "415 Jarvis St\nToronto, ON M4Y 2G8",
      primaryLanguage: "English",
      translationRequired: false,
      contactMethodPreference: "sms",
      emergencyContact: {
        name: "Ama Okafor",
        relationship: "Spouse",
        phone: "(416) 555-0992",
      },
      pharmacyOfChoice: "Shoppers Drug Mart",
      primaryInsurance: "Medicare Advantage",
    },
  }),
];

let cachedMap: ReadonlyMap<PatientId, PatientProfileAggregate> | null = null;

export function buildPatientProfileSeedMap(): ReadonlyMap<
  PatientId,
  PatientProfileAggregate
> {
  if (cachedMap) return cachedMap;
  const m = new Map<PatientId, PatientProfileAggregate>();
  for (const row of DEMO_PROFILES) {
    m.set(row.summary.patientId, row);
  }
  cachedMap = m;
  return m;
}

export function getPatientProfileSeed(
  patientId: string,
): PatientProfileAggregate | null {
  return buildPatientProfileSeedMap().get(patientId) ?? null;
}
