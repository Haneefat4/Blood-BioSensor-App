import { File as ExpoFile, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

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
