/**
 * Order → supplies copy matches the clinic-flow seed vocabulary (`visit.supplyReferenceLines`).
 * Supplies strings are the literal "Supplies" column from the product table (one shared line
 * per physical bundle after dedupe).
 */

export type LabSupplyBundleRow = {
  /** Stable key for UI state (e.g. per-bundle Pending/Done). */
  key: string;
  /** Literal supplies line from the Order → Supplies table (post-dedupe where applicable). */
  suppliesSummary: string;
  contributingOrders: readonly string[];
};

const UA = "Urinalysis (UA)";
const UC = "Urine Culture";

/** Exact strings from the Order → Supplies table. */
const SUPPLIES = {
  lavenderTop: "Lavender Top",
  goldTopSst: "Gold Top (SST)",
  blueTop: "Blue Top",
  grayTop: "Gray Top",
  rapidA1c: "A1C Swab/Cartridge + Fingerstick Lancet",
  rapidGlucose: "Glucose Strip + Fingerstick Lancet",
  strepFluCovid: "Sterile Swab + Developer Reagent Solution",
  inrFingerstick: "INR Test Strip + Fingerstick Lancet",
  ua: "Specimen Cup + UA Dipstick + Transfer Straw",
  urineCulture: "Specimen Cup + Gray Top Vacutainer Tube",
  uaAndCulture:
    "Specimen Cup + UA Dipstick + Transfer Straw + Gray Top Vacutainer Tube",
  fit: "Stool Collection Kit + Biohazard Bag",
  retinal: "Retinal Camera + Alcohol Wipes (for chin rest)",
} as const;

/** PCP order line (chip text) → internal bundle id (urine handled separately). */
const ORDER_TO_BUNDLE_KEY: Readonly<Record<string, string>> = {
  CBC: "lavender_top",
  "A1C (Lab)": "lavender_top",
  CMP: "gold_sst",
  BMP: "gold_sst",
  "Lipid Panel": "gold_sst",
  TSH: "gold_sst",
  "Vitamin D": "gold_sst",
  B12: "gold_sst",
  PSA: "gold_sst",
  "PT / INR (Coagulation)": "blue_coag",
  /** Legacy chip label — same supplies as coagulation draw. */
  "PT/INR (Lab)": "blue_coag",
  "Lactic Acid": "gray_top",
  "Blood Glucose": "gray_top",
  "Rapid A1C": "rapid_a1c",
  "Rapid Glucose": "rapid_glucose",
  "Rapid Strep A": "rapid_molecular",
  "Rapid Flu": "rapid_molecular",
  "Rapid COVID": "rapid_molecular",
  "PT/INR (Fingerstick)": "inr_fingerstick",
  "FIT Test (Colorectal)": "fit_kit",
  "Retinal Scan": "retinal_scan",
};

const BUNDLE_SUPPLIES: Readonly<
  Record<
    | "blue_coag"
    | "lavender_top"
    | "gold_sst"
    | "gray_top"
    | "rapid_a1c"
    | "rapid_glucose"
    | "rapid_molecular"
    | "inr_fingerstick"
    | "urine_ua_only"
    | "urine_culture_only"
    | "urine_combined"
    | "fit_kit"
    | "retinal_scan",
    string
  >
> = {
  blue_coag: SUPPLIES.blueTop,
  lavender_top: SUPPLIES.lavenderTop,
  gold_sst: SUPPLIES.goldTopSst,
  gray_top: SUPPLIES.grayTop,
  rapid_a1c: SUPPLIES.rapidA1c,
  rapid_glucose: SUPPLIES.rapidGlucose,
  rapid_molecular: SUPPLIES.strepFluCovid,
  inr_fingerstick: SUPPLIES.inrFingerstick,
  urine_ua_only: SUPPLIES.ua,
  urine_culture_only: SUPPLIES.urineCulture,
  urine_combined: SUPPLIES.uaAndCulture,
  fit_kit: SUPPLIES.fit,
  retinal_scan: SUPPLIES.retinal,
};

const BUNDLE_SORT_ORDER: readonly string[] = [
  "blue_coag",
  "lavender_top",
  "gold_sst",
  "gray_top",
  "rapid_a1c",
  "rapid_glucose",
  "inr_fingerstick",
  "urine_combined",
  "urine_ua_only",
  "urine_culture_only",
  "rapid_molecular",
  "fit_kit",
  "retinal_scan",
];

function uniqueOrdered(lines: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of lines) {
    const t = raw.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function pushOrder(map: Map<string, string[]>, bundleKey: string, order: string) {
  const list = map.get(bundleKey);
  if (list) list.push(order);
  else map.set(bundleKey, [order]);
}

/**
 * Deduplicated supply bundles implied by visit PCP order lines.
 * Urinalysis + urine culture collapse to one row when both are ordered.
 */
export function buildLabSupplyBundles(
  supplyReferenceLines: readonly string[],
): LabSupplyBundleRow[] {
  const orderedUnique = uniqueOrdered(supplyReferenceLines);
  const hasUA = orderedUnique.includes(UA);
  const hasUC = orderedUnique.includes(UC);

  const remaining = orderedUnique.filter((o) => o !== UA && o !== UC);
  const contributions = new Map<string, string[]>();

  for (const order of remaining) {
    const bundleKey = ORDER_TO_BUNDLE_KEY[order];
    if (bundleKey) {
      pushOrder(contributions, bundleKey, order);
    } else {
      pushOrder(contributions, `unmapped:${order}`, order);
    }
  }

  const rows: LabSupplyBundleRow[] = [];

  if (hasUA && hasUC) {
    rows.push({
      key: "urine_combined",
      suppliesSummary: BUNDLE_SUPPLIES.urine_combined,
      contributingOrders: [UA, UC],
    });
  } else if (hasUA) {
    rows.push({
      key: "urine_ua_only",
      suppliesSummary: BUNDLE_SUPPLIES.urine_ua_only,
      contributingOrders: [UA],
    });
  } else if (hasUC) {
    rows.push({
      key: "urine_culture_only",
      suppliesSummary: BUNDLE_SUPPLIES.urine_culture_only,
      contributingOrders: [UC],
    });
  }

  for (const [bundleKey, orders] of contributions) {
    if (bundleKey.startsWith("unmapped:")) {
      const [o] = orders;
      rows.push({
        key: bundleKey,
        suppliesSummary:
          "This order is not in the lab supply table — confirm supplies per protocol.",
        contributingOrders: orders.length ? orders : [o],
      });
      continue;
    }

    const suppliesSummary = BUNDLE_SUPPLIES[bundleKey as keyof typeof BUNDLE_SUPPLIES];
    if (!suppliesSummary) continue;

    rows.push({
      key: bundleKey,
      suppliesSummary,
      contributingOrders: [...orders],
    });
  }

  const orderIndex = (key: string): number => {
    const i = BUNDLE_SORT_ORDER.indexOf(key);
    return i === -1 ? 500 : i;
  };

  rows.sort((a, b) => {
    const d = orderIndex(a.key) - orderIndex(b.key);
    if (d !== 0) return d;
    return a.key.localeCompare(b.key);
  });

  return rows;
}
