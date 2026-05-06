import { format } from "date-fns";

import { intakeBundleProgressFromMissing } from "./intake-form-catalog";
import type { Appointment, RoomingSeed, VisitSeed } from "./types";

function rooming(seed: RoomingSeed): RoomingSeed {
  return seed;
}

function visit(seed: VisitSeed): VisitSeed {
  return seed;
}

/**
 * Visit → “Retrieve supplies”: `supplyReferenceLines` uses PCP order names only,
 * one per line. Canonical set: CBC, A1C (Lab), A1C (Rapid), CMP, BMP, Lipid Panel,
 * TSH, Vitamin D, B12, PT/INR (Lab), PT/INR (Fingerstick), PSA, Lactic Acid,
 * Blood Glucose, Rapid Strep A, Rapid Flu, Rapid COVID, Urinalysis (UA),
 * Urine Culture, FIT Test (Colorectal), Retinal Scan.
 */

export function buildSeedAppointments(): Appointment[] {
  const today = format(new Date(), "yyyy-MM-dd");

  const missingSarah = [
    "Authorization and Consent for treatment",
    "Communication form",
  ] as const;
  const missingRobert = [
    "Authorization and Consent for treatment",
    "Communication form",
    "ROI form",
    "TAPS",
    "VES-13",
  ] as const;
  const missingElena = ["PHQ 2/9", "GAD 2/7"] as const;
  const missingJames = [] as const;
  const missingMaria = [
    "Authorization and Consent for treatment",
    "Communication form",
    "ROI form",
    "TAPS",
  ] as const;
  const missingSamuel = [
    "Authorization and Consent for treatment",
    "Communication form",
    "PHQ 2/9",
    "GAD 2/7",
    "AAFP Social Needs",
    "VES-13",
  ] as const;
  const missingLinda = [] as const;
  const missingDavid = [
    "Authorization and Consent for treatment",
    "ROI form",
    "PHQ 2/9",
    "GAD 2/7",
    "AAFP Social Needs",
    "TAPS",
    "VES-13",
  ] as const;

  return [
    {
      id: "1",
      date: today,
      time: "08:00 AM",
      patientName: "Sarah Jenkins",
      dateOfBirth: "1948-03-12",
      room: "RM 1",
      stage: "PREVISIT",
      reason: "Post-Hospital Follow-up (CHF Exacerbation)",
      appointmentType: "Post-Acute Follow-up",
      estimatedDurationMins: 60,
      pcp: "Dr. Ellis",
      navigator: "Anna",
      missingFormNames: missingSarah,
      ...intakeBundleProgressFromMissing(missingSarah),
      intakeFormResults: [
        {
          id: "1-r1",
          formLabel: "PHQ 2/9",
          resultSummary: "18 (Severe)",
          navigatorAction: 'Positive for "Thoughts of self-harm"',
          shortFlag: "PHQ-9: 18",
          severity: "high",
        },
        {
          id: "1-r2",
          formLabel: "GAD 2/7",
          resultSummary: "12 (Moderate)",
          navigatorAction: "High anxiety regarding health",
          shortFlag: "GAD-7: 12",
          severity: "medium",
        },
        {
          id: "1-r3",
          formLabel: "AAFP Social Needs",
          resultSummary: "Food Insecurity",
          navigatorAction: 'Patient "often" worried about groceries',
          shortFlag: "Food: High Risk",
          severity: "high",
        },
        {
          id: "1-r4",
          formLabel: "VES-13",
          resultSummary: "Score: 5",
          navigatorAction: "Needs assistance with bathing & housework",
          shortFlag: "VES-13: 5",
          severity: "medium",
        },
        {
          id: "1-r5",
          formLabel: "TAPS",
          resultSummary: "Tobacco (Daily)",
          navigatorAction: "Patient interested in quitting",
          shortFlag: "TAPS: Tobacco",
          severity: "low",
        },
        {
          id: "1-r6",
          formLabel: "ROI form",
          resultSummary: "Needs Update",
          navigatorAction:
            'Current ROI for "Sarah Jenkins" expired 04/2026',
          shortFlag: "ROI: Expired",
          severity: "medium",
        },
      ],
      huddleTasks: [
        {
          id: "1-h1",
          text: "Order A1C test (Non-diabetic w/ high BMI)",
          completed: false,
        },
        { id: "1-h2", text: "Perform EKG (Recent ER visit)", completed: false },
      ],
      rooming: rooming({
        registration: {
          insurance: "Medicare with supplemental (Humana)",
          pharmacy: "Main Street Pharmacy",
          emergencyContact: "Mary Jenkins (daughter)",
          paymentSource: "Medicare",
        },
        orderedPoctTests: [
          { id: "1-p1", testType: "HEMOGLOBIN_A1C" },
          { id: "1-p2", testType: "BLOOD_GLUCOSE" },
          { id: "1-p3", testType: "PT_INR" },
          { id: "1-p4", testType: "URINALYSIS_DIP" },
          { id: "1-p5", testType: "EKG_12_LEAD" },
        ],
        medicationsOnFileMultiline:
          "Furosemide 40 mg tablet — 1 tab daily\nMetoprolol succinate 25 mg ER — 1 tab daily\nLisinopril 10 mg — 1 tab daily\nAtorvastatin 20 mg — 1 tab at bedtime\nAspirin 81 mg chewable — 1 tab daily",
      }),
      visit: visit({
        supplyReferenceLines: [
          "CBC",
          "BMP",
          "PT/INR (Lab)",
          "A1C (Lab)",
          "Blood Glucose",
        ],
      }),
    },
    {
      id: "2",
      date: today,
      time: "08:15 AM",
      patientName: "Robert Chen",
      dateOfBirth: "1959-10-02",
      room: "RM 3",
      stage: "INTAKE",
      reason: "Follow-up (Diabetes)",
      appointmentType: "Established Follow-up",
      estimatedDurationMins: 20,
      pcp: "Dr. Aris",
      navigator: "Anna",
      missingFormNames: missingRobert,
      ...intakeBundleProgressFromMissing(missingRobert),
      intakeFormResults: [
        {
          id: "2-r1",
          formLabel: "PHQ 2/9",
          resultSummary: "12 (Moderate)",
          navigatorAction: "Re-screen at next visit; no self-harm endorsement",
          shortFlag: "PHQ-9: 12",
          severity: "medium",
        },
        {
          id: "2-r2",
          formLabel: "GAD 2/7",
          resultSummary: "10 (Moderate)",
          navigatorAction: "Reports worry about glucose control and work stress",
          shortFlag: "GAD-7: 10",
          severity: "medium",
        },
        {
          id: "2-r3",
          formLabel: "AAFP Social Needs",
          resultSummary: "Food Insecurity",
          navigatorAction: "Skipped meals 2+ days in past month (self-report)",
          shortFlag: "Food: High Risk",
          severity: "high",
        },
      ],
      huddleTasks: [
        {
          id: "2-h1",
          text: "Confirm pharmacy for insulin start",
          completed: false,
        },
        { id: "2-h2", text: "Check foot exam status", completed: false },
      ],
      rooming: rooming({
        registration: {
          insurance: "Aetna PPO",
          pharmacy: "CVS Pharmacy",
          emergencyContact: "",
          paymentSource: "Commercial (copay waived)",
        },
        orderedPoctTests: [
          { id: "2-p1", testType: "HEMOGLOBIN_A1C" },
          { id: "2-p2", testType: "MICROALBUMIN" },
          { id: "2-p3", testType: "BLOOD_GLUCOSE" },
          { id: "2-p4", testType: "FECAL_OCCULT_FIT" },
        ],
        medicationsOnFileMultiline:
          "Metformin 1000 mg ER — 1 tab BID with meals\nGlimepiride 2 mg — 1 tab daily with breakfast\nSemaglutide 1 mg SQ weekly (Wed)\nLisinopril 20 mg — 1 tab daily\nRosuvastatin 10 mg — 1 tab daily",
      }),
      visit: visit({
        supplyReferenceLines: [
          "A1C (Rapid)",
          "Blood Glucose",
          "Lipid Panel",
          "Urinalysis (UA)",
        ],
      }),
    },
    {
      id: "3",
      date: today,
      time: "08:45 AM",
      patientName: "Elena Rodriguez",
      dateOfBirth: "1971-06-21",
      room: "WAIT",
      stage: "ROOMING",
      reason: "Acute: Cough",
      appointmentType: "Acute Sick Visit",
      estimatedDurationMins: 30,
      pcp: "Dr. Aris",
      navigator: "Anna",
      missingFormNames: missingElena,
      ...intakeBundleProgressFromMissing(missingElena),
      intakeFormResults: [],
      huddleTasks: [
        { id: "3-h1", text: "Check pulse ox on room air", completed: false },
        { id: "3-h2", text: "Verify home oxygen supply", completed: false },
      ],
      rooming: rooming({
        registration: {
          insurance: "",
          pharmacy: "Walgreens",
          emergencyContact: "Carlos Rodriguez (spouse)",
          paymentSource: "",
        },
        orderedPoctTests: [
          { id: "3-p1", testType: "STREP_FLU_COV" },
          { id: "3-p2", testType: "SPIROMETRY" },
          { id: "3-p3", testType: "BLOOD_GLUCOSE" },
        ],
        medicationsOnFileMultiline:
          "Albuterol HFA 90 mcg — 2 puffs q4h PRN\nFluticasone-salmeterol 250/50 — 1 puff BID\nMontelukast 10 mg — 1 tab nightly",
      }),
      visit: visit({
        supplyReferenceLines: [
          "Rapid Strep A",
          "Rapid Flu",
          "Rapid COVID",
          "CBC",
        ],
      }),
    },
    {
      id: "4",
      date: today,
      time: "09:30 AM",
      patientName: "James Wilson",
      dateOfBirth: "1964-01-08",
      room: "RM 2",
      stage: "VISIT",
      reason: "HTN Management",
      appointmentType: "Chronic Care Visit",
      estimatedDurationMins: 30,
      pcp: "Dr. Aris",
      navigator: "Anna",
      missingFormNames: missingJames,
      ...intakeBundleProgressFromMissing(missingJames),
      intakeFormResults: [
        {
          id: "4-r1",
          formLabel: "PHQ 2/9",
          resultSummary: "Negative screen",
          navigatorAction: "No PHQ-2 positive; PHQ-9 not triggered",
          shortFlag: "PHQ-2/9: Neg",
          severity: "low",
        },
        {
          id: "4-r2",
          formLabel: "GAD 2/7",
          resultSummary: "Negative screen",
          navigatorAction: "No GAD-2 positive; GAD-7 not triggered",
          shortFlag: "GAD-2/7: Neg",
          severity: "low",
        },
      ],
      huddleTasks: [
        { id: "4-h1", text: "Update BP medication list", completed: false },
        { id: "4-h2", text: "Schedule 3-month follow-up", completed: false },
      ],
      rooming: rooming({
        registration: {
          insurance: "UnitedHealthcare",
          pharmacy: "",
          emergencyContact: "James Wilson (self)",
          paymentSource: "Employer plan",
        },
        orderedPoctTests: [
          { id: "4-p1", testType: "HEMOGLOBIN" },
          { id: "4-p2", testType: "BLOOD_GLUCOSE" },
        ],
        medicationsOnFileMultiline:
          "Amlodipine 5 mg — 1 tab daily\nHCTZ 12.5 mg — 1 tab daily\nLosartan 50 mg — 1 tab daily",
      }),
      visit: visit({ supplyReferenceLines: [] }),
    },
    {
      id: "5",
      date: today,
      time: "10:00 AM",
      patientName: "Maria Garcia",
      dateOfBirth: "1942-11-30",
      room: "RM 4",
      stage: "LABS",
      reason: "New Patient Intake",
      appointmentType: "New Patient",
      estimatedDurationMins: 60,
      pcp: "Dr. Aris",
      navigator: "Anna",
      missingFormNames: missingMaria,
      ...intakeBundleProgressFromMissing(missingMaria),
      intakeFormResults: [
        {
          id: "5-r1",
          formLabel: "PHQ 2/9",
          resultSummary: "16 (Moderately Severe)",
          navigatorAction: "Discuss safety plan; behavioral health referral",
          shortFlag: "PHQ-9: 16",
          severity: "high",
        },
        {
          id: "5-r2",
          formLabel: "GAD 2/7",
          resultSummary: "11 (Moderate)",
          navigatorAction: "Anxiety focused on new diagnosis and finances",
          shortFlag: "GAD-7: 11",
          severity: "medium",
        },
        {
          id: "5-r3",
          formLabel: "VES-13",
          resultSummary: "Score: 6",
          navigatorAction: "Vulnerability score suggests care coordination",
          shortFlag: "VES-13: 6",
          severity: "medium",
        },
        {
          id: "5-r4",
          formLabel: "AAFP Social Needs",
          resultSummary: "Transportation barrier",
          navigatorAction: "Missed last appointment due to ride access",
          shortFlag: "Transport: Risk",
          severity: "medium",
        },
      ],
      huddleTasks: [
        {
          id: "5-h1",
          text: "New Patient: Obtain outside records",
          completed: false,
        },
        { id: "5-h2", text: "Review vaccine history", completed: false },
      ],
      rooming: rooming({
        registration: {
          insurance: "Medicare and Medicaid",
          pharmacy: "Community Health Pharmacy",
          emergencyContact: "Sofia Garcia (daughter)",
          paymentSource: "Medicaid",
        },
        orderedPoctTests: [
          { id: "5-p1", testType: "RETINAL_SCAN" },
          { id: "5-p2", testType: "URINALYSIS_DIP" },
          { id: "5-p3", testType: "HEMOGLOBIN_A1C" },
          { id: "5-p4", testType: "EAR_LAVAGE" },
        ],
        medicationsOnFileMultiline:
          "Metformin 500 mg — 1 tab TID with meals\nGlyburide 5 mg — 1 tab BID\nOmeprazole 20 mg — 1 tab daily before breakfast\nAspirin 81 mg — 1 tab daily",
      }),
      visit: visit({
        supplyReferenceLines: [
          "CBC",
          "CMP",
          "TSH",
          "Vitamin D",
          "B12",
          "Urinalysis (UA)",
          "Urine Culture",
          "FIT Test (Colorectal)",
          "Retinal Scan",
        ],
      }),
    },
    {
      id: "6",
      date: today,
      time: "10:15 AM",
      patientName: "Samuel Lee",
      dateOfBirth: "1952-07-04",
      room: "LAB 1",
      stage: "CARE MANAGEMENT",
      reason: "Blood Work",
      appointmentType: "Lab Draw",
      estimatedDurationMins: 15,
      pcp: "Dr. Aris",
      navigator: "Anna",
      missingFormNames: missingSamuel,
      ...intakeBundleProgressFromMissing(missingSamuel),
      intakeFormResults: [
        {
          id: "6-r1",
          formLabel: "TAPS",
          resultSummary: "Tobacco (Daily)",
          navigatorAction: "Willing to set a quit date this month",
          shortFlag: "TAPS: Tobacco",
          severity: "low",
        },
        {
          id: "6-r2",
          formLabel: "ROI form",
          resultSummary: "Needs Update",
          navigatorAction:
            'Current ROI for "Samuel Lee" expired 02/2026',
          shortFlag: "ROI: Expired",
          severity: "medium",
        },
      ],
      huddleTasks: [
        { id: "6-h1", text: "Lab prep: Fasting check", completed: false },
        {
          id: "6-h2",
          text: "Verify insurance for specialty labs",
          completed: false,
        },
      ],
      rooming: rooming({
        registration: {
          insurance: "Blue Cross PPO",
          pharmacy: "Rite Aid",
          emergencyContact: "",
          paymentSource: "",
        },
        orderedPoctTests: [
          { id: "6-p1", testType: "PT_INR" },
          { id: "6-p2", testType: "BLOOD_GLUCOSE" },
          { id: "6-p3", testType: "HEMOGLOBIN" },
        ],
        medicationsOnFileMultiline:
          "Warfarin 5 mg — per INR clinic sheet\nAtorvastatin 40 mg — 1 tab nightly",
      }),
      visit: visit({
        supplyReferenceLines: [
          "CBC",
          "PT/INR (Fingerstick)",
          "Lactic Acid",
        ],
      }),
    },
    {
      id: "7",
      date: today,
      time: "11:00 AM",
      patientName: "Linda Wu",
      dateOfBirth: "1960-09-16",
      room: "WAIT",
      stage: "WRAP UP",
      reason: "Post-Op Check",
      appointmentType: "Procedure Follow-up",
      estimatedDurationMins: 45,
      pcp: "Dr. Aris",
      navigator: "Anna",
      missingFormNames: missingLinda,
      ...intakeBundleProgressFromMissing(missingLinda),
      intakeFormResults: [],
      huddleTasks: [
        { id: "7-h1", text: "Post-Op: Check incision site", completed: false },
        { id: "7-h2", text: "Remove sutures", completed: false },
      ],
      rooming: rooming({
        registration: {
          insurance: "Cigna",
          pharmacy: "Costco Pharmacy",
          emergencyContact: "Peter Wu",
          paymentSource: "Commercial",
        },
        orderedPoctTests: [
          { id: "7-p1", testType: "EKG_12_LEAD" },
          { id: "7-p2", testType: "URINALYSIS_DIP" },
        ],
        medicationsOnFileMultiline:
          "Ibuprofen 600 mg — 1 tab q6h PRN pain (max 4/day)\nAcetaminophen 500 mg — 2 tabs q6h PRN\nCephalexin 500 mg — 1 cap qid x7 days (post-op course completed)",
      }),
      visit: visit({
        supplyReferenceLines: ["CBC", "PSA", "Urine Culture"],
      }),
    },
    {
      id: "8",
      date: today,
      time: "11:30 AM",
      patientName: "David Miller",
      dateOfBirth: "1988-05-05",
      room: "RM 5",
      stage: "VISIT",
      reason: "Immunizations",
      appointmentType: "Nurse Visit",
      estimatedDurationMins: 30,
      pcp: "Dr. Aris",
      navigator: "Anna",
      missingFormNames: missingDavid,
      ...intakeBundleProgressFromMissing(missingDavid),
      intakeFormResults: [
        {
          id: "8-r1",
          formLabel: "Communication form",
          resultSummary: "Vaccine allergy noted",
          navigatorAction:
            "Prior reaction documented; hold immunizations pending review",
          shortFlag: "Comm: Allergy",
          severity: "high",
        },
      ],
      huddleTasks: [
        {
          id: "8-h1",
          text: "Pediatric: School form signature",
          completed: false,
        },
        { id: "8-h2", text: "Administer flu shot", completed: false },
      ],
      rooming: rooming({
        registration: {
          insurance: "",
          pharmacy: "",
          emergencyContact: "Rachel Miller (parent)",
          paymentSource: "Self-pay",
        },
        orderedPoctTests: [{ id: "8-p1", testType: "STREP_FLU_COV" }],
        medicationsOnFileMultiline: "",
      }),
      visit: visit({
        supplyReferenceLines: ["Rapid Flu", "Rapid COVID"],
      }),
    },
  ];
}
