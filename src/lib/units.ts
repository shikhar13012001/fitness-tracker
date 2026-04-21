// ─── Unit conversion helpers ─────────────────────────────────────────────────
// All stored values in DB are ALWAYS in kg (canonical unit).
// These helpers convert for display only.

export type Unit = "kg" | "lbs";

export const LB_PER_KG = 2.20462;
export const KG_PER_LB = 0.453592;

/** Convert a stored-kg value to display units */
export function kgToDisplay(kg: number, unit: Unit): number {
  return unit === "lbs" ? kg * LB_PER_KG : kg;
}

/** Convert a user-entered display value back to kg for storage */
export function displayToKg(val: number, unit: Unit): number {
  return unit === "lbs" ? val * KG_PER_LB : val;
}

/** Format a stored-kg value with unit label, e.g. "82.5 kg" or "181.9 lbs" */
export function formatWeight(kg: number, unit: Unit, decimals = 1): string {
  const v = kgToDisplay(kg, unit);
  return `${v.toFixed(decimals)} ${unit}`;
}

/** Round display weight to 1 decimal for use in input defaults */
export function defaultDisplayWeight(kg: number, unit: Unit): string {
  if (kg === 0 || kg === null) return "0";
  const v = kgToDisplay(kg, unit);
  return String(Math.round(v * 10) / 10);
}

/** Validate range: 20 kg–300 kg in either unit */
export function isValidBodyweight(val: number, unit: Unit): boolean {
  const kg = displayToKg(val, unit);
  return !isNaN(kg) && kg >= 20 && kg <= 300;
}
