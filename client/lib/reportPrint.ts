const PRINT_CONTROLS = `
<div class="screen-only">
  <p>This is your Blood Biosensor report. Choose <strong>Save as PDF</strong> in the print dialog.</p>
  <button type="button" onclick="window.print()">Save as PDF</button>
</div>
<style>
  .screen-only { margin: 16px 0; padding: 12px 16px; border: 1px solid #2563EB; border-radius: 12px; }
  .screen-only p { margin: 0 0 8px; font-size: 14px; }
  .screen-only button { min-height: 44px; padding: 8px 16px; background: #2563EB; color: #ffffff; border: 0; border-radius: 999px; font-weight: 600; font-size: 16px; }
  @media print { .screen-only { display: none !important; } }
</style>
<script>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print();},200);});</script>
`;

/**
 * Add a print hint to a report page. The hint is hidden when the page is printed,
 * so a saved PDF contains the log and not the instructions.
 */
export function printableReportHtml(html: string): string {
  const bodyOpen = html.match(/<body[^>]*>/i);
  if (bodyOpen && bodyOpen.index != null) {
    const insertAt = bodyOpen.index + bodyOpen[0].length;
    return html.slice(0, insertAt) + PRINT_CONTROLS + html.slice(insertAt);
  }
  return PRINT_CONTROLS + html;
}
