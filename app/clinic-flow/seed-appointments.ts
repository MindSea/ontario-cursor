import { format } from "date-fns";

import type { Appointment } from "./types";

export function buildSeedAppointments(): Appointment[] {
  const today = format(new Date(), "yyyy-MM-dd");
  return [
    {
      id: "1",
      date: today,
      time: "08:00 AM",
      patientName: "Sarah Jenkins",
      room: "RM 1",
      stage: "PREVISIT",
      reason: "Post-Hospital Follow-up (CHF Exacerbation)",
      pcp: "Dr. Ellis",
      navigator: "Anna",
      huddleTasks: [
        {
          id: "1-h1",
          text: "Order A1C test (Non-diabetic w/ high BMI)",
          completed: false,
        },
        { id: "1-h2", text: "Perform EKG (Recent ER visit)", completed: false },
      ],
    },
    {
      id: "2",
      date: today,
      time: "08:15 AM",
      patientName: "Robert Chen",
      room: "RM 3",
      stage: "INTAKE",
      reason: "Follow-up (Diabetes)",
      pcp: "Dr. Aris",
      navigator: "Anna",
      huddleTasks: [
        {
          id: "2-h1",
          text: "Confirm pharmacy for insulin start",
          completed: false,
        },
        { id: "2-h2", text: "Check foot exam status", completed: false },
      ],
    },
    {
      id: "3",
      date: today,
      time: "08:45 AM",
      patientName: "Elena Rodriguez",
      room: "WAIT",
      stage: "ROOMING",
      reason: "Acute: Cough",
      pcp: "Dr. Aris",
      navigator: "Anna",
      huddleTasks: [
        { id: "3-h1", text: "Check pulse ox on room air", completed: false },
        { id: "3-h2", text: "Verify home oxygen supply", completed: false },
      ],
    },
    {
      id: "4",
      date: today,
      time: "09:30 AM",
      patientName: "James Wilson",
      room: "RM 2",
      stage: "VISIT",
      reason: "HTN Management",
      pcp: "Dr. Aris",
      navigator: "Anna",
      huddleTasks: [
        { id: "4-h1", text: "Update BP medication list", completed: false },
        { id: "4-h2", text: "Schedule 3-month follow-up", completed: false },
      ],
    },
    {
      id: "5",
      date: today,
      time: "10:00 AM",
      patientName: "Maria Garcia",
      room: "RM 4",
      stage: "LABS",
      reason: "New Patient Intake",
      pcp: "Dr. Aris",
      navigator: "Anna",
      huddleTasks: [
        {
          id: "5-h1",
          text: "New Patient: Obtain outside records",
          completed: false,
        },
        { id: "5-h2", text: "Review vaccine history", completed: false },
      ],
    },
    {
      id: "6",
      date: today,
      time: "10:15 AM",
      patientName: "Samuel Lee",
      room: "LAB 1",
      stage: "CARE MANAGEMENT",
      reason: "Blood Work",
      pcp: "Dr. Aris",
      navigator: "Anna",
      huddleTasks: [
        { id: "6-h1", text: "Lab prep: Fasting check", completed: false },
        {
          id: "6-h2",
          text: "Verify insurance for specialty labs",
          completed: false,
        },
      ],
    },
    {
      id: "7",
      date: today,
      time: "11:00 AM",
      patientName: "Linda Wu",
      room: "WAIT",
      stage: "WRAP UP",
      reason: "Post-Op Check",
      pcp: "Dr. Aris",
      navigator: "Anna",
      huddleTasks: [
        { id: "7-h1", text: "Post-Op: Check incision site", completed: false },
        { id: "7-h2", text: "Remove sutures", completed: false },
      ],
    },
    {
      id: "8",
      date: today,
      time: "11:30 AM",
      patientName: "David Miller",
      room: "RM 5",
      stage: "VISIT",
      reason: "Immunizations",
      pcp: "Dr. Aris",
      navigator: "Anna",
      huddleTasks: [
        {
          id: "8-h1",
          text: "Pediatric: School form signature",
          completed: false,
        },
        { id: "8-h2", text: "Administer flu shot", completed: false },
      ],
    },
  ];
}
