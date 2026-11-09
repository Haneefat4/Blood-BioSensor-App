import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildReadingsCsv,
  buildReadingsPdfHtml,
  escapeCsvCell,
  escapeHtml,
} from "./exportFormat";
import type { Reading } from "@/types";

const reading: Reading = {
  id: "1",
  type: "glucose",
  value: 90,
  unit: "mg/dL",
  timestamp: Date.parse("2026-01-01T12:00:00Z"),
  status: "normal",
  notes: `<img src=x onerror="alert(1)">`,
};

describe("escapeHtml", () => {
  it("escapes markup characters", () => {
    assert.equal(
      escapeHtml(`<script>alert("x") & 'y'</script>`),
      "&lt;script&gt;alert(&quot;x&quot;) &amp; &#39;y&#39;&lt;/script&gt;",
    );
  });
});

describe("escapeCsvCell", () => {
  it("quotes quotes and prefixes formula characters", () => {
    assert.equal(escapeCsvCell(`he said "hi"`), `"he said ""hi"""`);
    assert.equal(
      escapeCsvCell(`=HYPERLINK("http://example.test")`),
      `"'=HYPERLINK(""http://example.test"")"`,
    );
  });
});

describe("buildReadingsPdfHtml", () => {
  it("escapes the display name and notes so they cannot become markup", () => {
    const html = buildReadingsPdfHtml({
      displayName: `Ann <script>alert("x")</script>`,
      readings: [reading],
      units: "mg/dL",
      sex: "unspecified",
      generatedAt: new Date("2026-01-02T15:04:00Z"),
    });

    assert.equal(html.includes("<script>"), false);
    assert.equal(html.includes("<img"), false);
    assert.equal(html.includes("onerror"), true);
    assert.ok(html.includes("&lt;script&gt;"));
    assert.ok(html.includes("&lt;img"));
    assert.ok(html.includes("Ann"));
    assert.ok(html.includes("Not a medical device"));
  });
});

describe("buildReadingsCsv", () => {
  it("writes notes as a quoted text cell, including formula-like notes", () => {
    const csv = buildReadingsCsv([{ ...reading, notes: `=CMD|"hi"` }], {
      units: "mg/dL",
      sex: "unspecified",
    });

    assert.ok(csv.startsWith("\uFEFF"));
    assert.ok(csv.includes(`"'=CMD|""hi"""`));
    assert.equal(csv.includes("<script>"), false);
  });
});
