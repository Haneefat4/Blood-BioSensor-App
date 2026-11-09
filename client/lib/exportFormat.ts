import { assessReading, REFERENCE_RANGE_NOTE } from "@/lib/referenceRanges";
import {
  displayUnitFor,
  formatMeasurement,
  type UnitSystem,
} from "@/lib/units";
import type { Reading, ReferenceSex } from "@/types";
import { READING_CONFIG, READING_TAGS } from "@/types";

const NOT_A_DEVICE =
  "Personal log only. Not a medical device and not medical advice.";

/** Escape text that will be inserted into HTML so notes cannot become markup. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Quote a CSV cell and neutralize spreadsheet formulas in user-entered text.
 */
export function escapeCsvCell(value: string): string {
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const guarded = /^[=+\-@\t]/.test(normalized) ? `'${normalized}` : normalized;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export interface ExportContext {
  units: UnitSystem;
  sex: ReferenceSex;
}

function tagLabels(reading: Reading): string {
  return (
    reading.tags
      ?.map(
        (tagId) => READING_TAGS.find((tag) => tag.id === tagId)?.label || tagId,
      )
      .join("; ") ?? ""
  );
}

function statusLabel(reading: Reading, context: ExportContext): string {
  return assessReading({
    type: reading.type,
    canonicalValue: reading.value,
    isFasting: reading.isFasting,
    sex: context.sex,
  }).label;
}

export function buildReadingsCsv(
  readings: readonly Reading[],
  context: ExportContext,
): string {
  const headers = [
    "Date",
    "Time",
    "Type",
    "Value",
    "Unit",
    "Status",
    "Fasting",
    "Tags",
    "Notes",
  ];
  const rows = readings.map((reading) => {
    const date = new Date(reading.timestamp);
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      READING_CONFIG[reading.type].label,
      formatMeasurement(reading.type, reading.value, context.units),
      displayUnitFor(reading.type, context.units),
      statusLabel(reading, context),
      reading.isFasting ? "Yes" : "No",
      tagLabels(reading),
      reading.notes ?? "",
    ]
      .map((cell) => escapeCsvCell(String(cell)))
      .join(",");
  });

  return `\uFEFF${[headers.map((cell) => escapeCsvCell(cell)).join(","), ...rows].join("\n")}`;
}

export function buildReadingsPdfHtml(input: {
  displayName: string;
  readings: readonly Reading[];
  units: UnitSystem;
  sex: ReferenceSex;
  generatedAt?: Date;
}): string {
  const generatedAt = input.generatedAt ?? new Date();
  const rows = input.readings
    .map((reading) => {
      const when = new Date(reading.timestamp);
      const unit = displayUnitFor(reading.type, input.units);
      const value = formatMeasurement(reading.type, reading.value, input.units);
      const assessment = assessReading({
        type: reading.type,
        canonicalValue: reading.value,
        isFasting: reading.isFasting,
        sex: input.sex,
      });
      const note = reading.notes?.trim() ? escapeHtml(reading.notes) : "-";
      return `
        <tr>
          <td>${escapeHtml(when.toLocaleString())}</td>
          <td>${escapeHtml(READING_CONFIG[reading.type].label)}</td>
          <td>${escapeHtml(`${value} ${unit}`)}</td>
          <td>${escapeHtml(assessment.label)}</td>
          <td>${reading.isFasting ? "Fasting" : "-"}</td>
          <td>${note}</td>
        </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Blood Biosensor log</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #111827; }
    h1 { color: #2563EB; font-size: 22px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #2563EB; color: #ffffff; }
    .note { color: #4b5563; font-size: 13px; }
  </style>
</head>
<body>
  <h1>Blood Biosensor log</h1>
  <p><strong>Name:</strong> ${escapeHtml(input.displayName)}</p>
  <p><strong>Created:</strong> ${escapeHtml(generatedAt.toLocaleString())}</p>
  <p><strong>Readings:</strong> ${input.readings.length}</p>
  <p class="note">${escapeHtml(REFERENCE_RANGE_NOTE)} ${escapeHtml(NOT_A_DEVICE)}</p>
  <table>
    <tr>
      <th>When</th>
      <th>Type</th>
      <th>Value</th>
      <th>Compared with usual range</th>
      <th>Fasting</th>
      <th>Notes</th>
    </tr>
    ${rows}
  </table>
</body>
</html>`;
}
