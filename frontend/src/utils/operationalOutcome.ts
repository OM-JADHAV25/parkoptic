/**
 * Operational Outcome Presentation Utility
 * Formats baseline vs. simulated metrics for executive decision support.
 */

export interface OutcomeResult {
  label: string;
  beforeVal: string;
  afterVal: string;
  transitionArrow: string;
  changeText: string;
  subText?: string;
  direction: "improvement" | "degradation" | "no-change" | "neutral";
  color: string;
  interpretation?: string;
}

const COLOR_SUCCESS = "#10b981"; // Green
const COLOR_CRITICAL = "#ef4444"; // Red
const COLOR_BRAND = "#22d3ee"; // Cyan
const COLOR_WARNING = "#d97706"; // Amber
const COLOR_MUTED = "rgba(255, 255, 255, 0.4)"; // Muted Gray

export function formatTDPIOutcome(before: number | undefined, after: number | undefined): OutcomeResult {
  const b = before ?? 0;
  const a = after ?? 0;
  const diff = a - b;
  const absDiff = Math.abs(diff);

  const formatVal = (v: number) => (Number.isInteger(v) ? v.toString() : v.toFixed(2)) + "%";

  if (absDiff < 0.05) {
    return {
      label: "TDPI",
      beforeVal: formatVal(b),
      afterVal: formatVal(a),
      transitionArrow: "→",
      changeText: "No measurable operational change",
      direction: "no-change",
      color: COLOR_MUTED
    };
  }

  const improved = diff < 0; // lower is better
  const pctChange = b > 0 ? Math.round((absDiff / b) * 100) : 0;

  return {
    label: "TDPI",
    beforeVal: formatVal(b),
    afterVal: formatVal(a),
    transitionArrow: "↓",
    changeText: `${absDiff.toFixed(2)} percentage points ${improved ? "lower" : "higher"}`,
    subText: pctChange > 0 ? `(${pctChange}% ${improved ? "lower" : "higher"})` : undefined,
    direction: improved ? "improvement" : "degradation",
    color: improved ? COLOR_SUCCESS : COLOR_CRITICAL
  };
}

export function formatVisibilityOutcome(before: number | undefined, after: number | undefined): OutcomeResult {
  const b = before ?? 0;
  const a = after ?? 0;
  const diff = a - b;
  const absDiff = Math.abs(diff);

  const formatVal = (v: number) => (Number.isInteger(v) ? v.toString() : v.toFixed(2)) + "%";

  if (absDiff < 0.05) {
    return {
      label: "Visibility Gap",
      beforeVal: formatVal(b),
      afterVal: formatVal(a),
      transitionArrow: "→",
      changeText: "No measurable operational change",
      direction: "no-change",
      color: COLOR_MUTED
    };
  }

  const improved = diff < 0; // lower is better
  const pctChange = b > 0 ? Math.round((absDiff / b) * 100) : 0;

  return {
    label: "Visibility Gap",
    beforeVal: formatVal(b),
    afterVal: formatVal(a),
    transitionArrow: "↓",
    changeText: `${absDiff.toFixed(2)} percentage points ${improved ? "lower" : "higher"}`,
    subText: pctChange > 0 ? `(${pctChange}% ${improved ? "lower" : "higher"})` : undefined,
    direction: improved ? "improvement" : "degradation",
    color: improved ? COLOR_SUCCESS : COLOR_CRITICAL
  };
}

export function formatPatrolOutcome(before: number | undefined, after: number | undefined): OutcomeResult {
  const b = before ?? 0;
  const a = after ?? 0;
  const diff = a - b;

  const beforeText = `${b} Patrol Unit${b !== 1 ? "s" : ""}`;
  const afterText = `${a} Patrol Unit${a !== 1 ? "s" : ""}`;

  if (diff === 0) {
    return {
      label: "Patrol Allocation",
      beforeVal: beforeText,
      afterVal: afterText,
      transitionArrow: "→",
      changeText: "No additional patrol units required",
      direction: "no-change",
      color: COLOR_MUTED
    };
  }

  return {
    label: "Patrol Allocation",
    beforeVal: beforeText,
    afterVal: afterText,
    transitionArrow: "↓",
    changeText: `${diff > 0 ? "+" : ""}${diff} Patrol Unit${Math.abs(diff) !== 1 ? "s" : ""}`,
    direction: "neutral",
    color: COLOR_BRAND // Patrol Allocation is a decision, use operational Cyan
  };
}

export function formatCapacityOutcome(
  beforeCapacity: number,
  afterCapacity: number,
  demand: number,
  beforeUtilization: number,
  afterUtilization: number
): OutcomeResult {
  const diff = afterUtilization - beforeUtilization;
  const absDiff = Math.abs(diff);

  const beforeText = `${beforeUtilization}%`;
  const afterText = `${afterUtilization}%`;

  let interpretation = "Capacity comfortably exceeds projected demand.";
  let color = COLOR_SUCCESS;
  let direction: OutcomeResult["direction"] = "improvement";

  if (afterUtilization > 80) {
    interpretation = "Capacity approaching operational limits.";
    color = afterUtilization > 90 ? COLOR_CRITICAL : COLOR_WARNING;
    direction = "degradation";
  } else if (afterUtilization === 0) {
    interpretation = "Capacity exceeds projected demand.";
    color = COLOR_MUTED;
    direction = "no-change";
  } else {
    interpretation = "Capacity remains within safe operational limits.";
    color = COLOR_SUCCESS;
    direction = "improvement";
  }

  if (absDiff === 0) {
    return {
      label: "Capacity Utilization",
      beforeVal: beforeText,
      afterVal: afterText,
      transitionArrow: "→",
      changeText: "No measurable operational change",
      direction: "no-change",
      color: COLOR_MUTED,
      interpretation
    };
  }

  const changeText = diff < 0 
    ? `${absDiff} percentage points lower` 
    : `Higher utilization due to additional patrol deployment.`;

  return {
    label: "Capacity Utilization",
    beforeVal: beforeText,
    afterVal: afterText,
    transitionArrow: "↓",
    changeText,
    direction: diff < 0 ? "improvement" : "neutral",
    color: diff < 0 ? COLOR_SUCCESS : color,
    interpretation
  };
}

export function generateExecutiveSummary(
  recommendedPatrols: number,
  beforeTdpi: number,
  afterTdpi: number
): string {
  const formatTdpi = (v: number) => (Number.isInteger(v) ? v.toString() : v.toFixed(2)) + "%";
  return `Deploying **${recommendedPatrols} patrol unit${recommendedPatrols !== 1 ? "s" : ""}** is expected to reduce operational pressure from **${formatTdpi(beforeTdpi)}** to **${formatTdpi(afterTdpi)}** while maintaining adequate visibility coverage.`;
}
