import { File as ExpoFile, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { printableReportHtml } from "@/lib/reportPrint";

export function isShareCancelled(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /cancel|dismiss/i.test(message);
}

function safeFileName(filename: string): string {
  const cleaned = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  return cleaned.length > 0 ? cleaned : "blood-biosensor-export.txt";
}

function downloadOnWeb(
  filename: string,
  contents: string,
  mimeType: string,
): void {
  const blob = new Blob([contents], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export type PdfShareResult = "printed" | "shared" | "html";

/**
 * Share a PDF report.
 * On web, expo-print calls window.print(), which prints the open screen.
 * Open the report in its own tab instead, where Save as PDF is the report.
 */
export async function sharePdfReport(
  filename: string,
  html: string,
): Promise<PdfShareResult> {
  const safeName = safeFileName(
    filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`,
  );
  if (Platform.OS === "web") {
    const page = printableReportHtml(html);
    if (openReportWindow(page)) return "printed";
    downloadOnWeb(safeName.replace(/\.pdf$/i, ".html"), page, "text/html");
    return "html";
  }

  const { uri } = await Print.printToFileAsync({ html });
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error("Sharing is not available on this device.");
  }
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: "Share Blood Biosensor log",
    UTI: "com.adobe.pdf",
  });
  return "shared";
}

function openReportWindow(html: string): boolean {
  const popup = window.open("", "_blank");
  if (!popup) return false;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  return true;
}

/** Write a text file and open the system share sheet. On web, download it. */
export async function shareTextFile(
  filename: string,
  contents: string,
  mimeType: string,
): Promise<void> {
  const safeName = safeFileName(filename);
  if (Platform.OS === "web") {
    downloadOnWeb(safeName, contents, mimeType);
    return;
  }

  const file = new ExpoFile(Paths.cache, safeName);
  file.create({ overwrite: true });
  file.write(contents);

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error("Sharing is not available on this device.");
  }

  await Sharing.shareAsync(file.uri, {
    mimeType,
    dialogTitle: safeName,
    UTI:
      mimeType === "text/csv"
        ? "public.comma-separated-values-text"
        : "public.plain-text",
  });
}
