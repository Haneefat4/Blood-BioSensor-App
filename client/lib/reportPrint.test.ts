import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildReadingsPdfHtml } from "./exportFormat";
import { printableReportHtml } from "./reportPrint";
import type { Reading } from "@/types";

const reading: Reading = {
  id: "1",
  type: "glucose",
  value: 90,
  unit: "mg/dL",
  timestamp: Date.parse("2026-11-09T15:00:00Z"),
  status: "normal",
  notes: "morning check",
};

describe("printableReportHtml", () => {
  it("keeps the report and adds a Save as PDF action that is hidden when printing", () => {
    const report = buildReadingsPdfHtml({
      displayName: "Ada",
      readings: [reading],
      units: "mg/dL",
      sex: "unspecified",
    });
    const page = printableReportHtml(report);

    assert.match(page, /Blood Biosensor log/);
    assert.match(page, /morning check/);
    assert.match(page, /Save as PDF/);
    assert.match(page, /window\.print\(\)/);
    assert.match(
      page,
      /@media print \{ \.screen-only \{ display: none !important; \} \}/,
    );
    assert.ok(page.indexOf("Save as PDF") < page.indexOf("morning check"));
  });
});
