import { PhotoPickError, type PhotoSource } from "@/lib/photoPick";

const MAX_EDGE = 1600;

type Drawable = {
  width: number;
  height: number;
};

function cameraFailureMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera access was blocked. Choose a photo file instead, or allow the camera in the browser settings.";
  }
  if (name === "NotFoundError" || name === "NotReadableError") {
    return "No camera is available in this browser. Choose a photo file instead.";
  }
  return "The camera could not be started. Choose a photo file instead.";
}

function chooseImageFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.style.position = "fixed";
    input.style.left = "0";
    input.style.top = "0";
    input.style.opacity = "0";
    input.setAttribute("aria-hidden", "true");
    let settled = false;
    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(file);
    };
    input.addEventListener("change", () => {
      finish(input.files?.[0] ?? null);
    });
    input.addEventListener("cancel", () => finish(null));
    document.body.appendChild(input);
    input.click();
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new PhotoPickError(
          "failed",
          "This browser could not read that image. Try a JPEG or PNG.",
        ),
      );
    };
    image.src = url;
  });
}

function drawToJpeg(source: CanvasImageSource, size: Drawable): string {
  const longest = Math.max(size.width, size.height);
  const scale = longest > 0 ? Math.min(1, MAX_EDGE / longest) : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(size.width * scale));
  canvas.height = Math.max(1, Math.round(size.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    throw new PhotoPickError(
      "failed",
      "This browser could not save that image.",
    );
  }
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

async function fileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new PhotoPickError("failed", "Choose an image file.");
  }
  const image = await loadImage(file);
  return drawToJpeg(image, {
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
  });
}

function buttonStyle(background: string, color: string): string {
  return [
    "min-height:44px",
    "padding:8px 16px",
    "border:0",
    "border-radius:999px",
    "font-size:16px",
    "font-weight:600",
    `background:${background}`,
    `color:${color}`,
    "cursor:pointer",
  ].join(";");
}

/**
 * Ask for a webcam snapshot. If the camera cannot start, the dialog stays
 * open with a file chooser so the button never does nothing.
 */
function captureFromCamera(): Promise<string | null> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return chooseImageFile().then((file) =>
      file ? fileToDataUrl(file) : null,
    );
  }

  return new Promise((resolve, reject) => {
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const card = dark ? "#374151" : "#FFFFFF";
    const text = dark ? "#F9FAFB" : "#111827";
    const muted = dark ? "#9CA3AF" : "#6B7280";
    const overlay = document.createElement("div");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "web-camera-title");
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483646",
      "background:rgba(17,24,39,0.72)",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:16px",
    ].join(";");

    const panel = document.createElement("div");
    panel.style.cssText = [
      `background:${card}`,
      `color:${text}`,
      "width:min(480px, 100%)",
      "border-radius:24px",
      "padding:20px",
      "display:flex",
      "flex-direction:column",
      "gap:12px",
      "font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif",
    ].join(";");

    const title = document.createElement("h2");
    title.id = "web-camera-title";
    title.textContent = "Take a photo";
    title.style.cssText = "margin:0;font-size:18px;";

    const video = document.createElement("video");
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.style.cssText =
      "width:100%;max-height:50vh;background:#111827;border-radius:12px;object-fit:cover;";

    const status = document.createElement("p");
    status.setAttribute("aria-live", "polite");
    status.textContent = "Starting the camera…";
    status.style.cssText = `margin:0;color:${muted};font-size:14px;`;

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;";

    const captureButton = document.createElement("button");
    captureButton.type = "button";
    captureButton.textContent = "Capture";
    captureButton.disabled = true;
    captureButton.style.cssText = buttonStyle("#2563EB", "#FFFFFF");

    const fileButton = document.createElement("button");
    fileButton.type = "button";
    fileButton.textContent = "Choose a file";
    fileButton.style.cssText = buttonStyle(dark ? "#4B5563" : "#E5E7EB", text);

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";
    cancelButton.style.cssText = buttonStyle("transparent", text);
    cancelButton.style.border = `1px solid ${dark ? "#4B5563" : "#E5E7EB"}`;

    actions.append(captureButton, fileButton, cancelButton);
    panel.append(title, video, status, actions);
    overlay.append(panel);
    document.body.appendChild(overlay);
    cancelButton.focus();

    let stream: MediaStream | null = null;
    let settled = false;

    const stopStream = () => {
      stream?.getTracks().forEach((track) => track.stop());
      stream = null;
    };

    const finish = (value: string | null, error?: Error) => {
      if (settled) return;
      settled = true;
      document.removeEventListener("keydown", onKey);
      stopStream();
      overlay.remove();
      if (error) reject(error);
      else resolve(value);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish(null);
    };
    document.addEventListener("keydown", onKey);

    captureButton.addEventListener("click", () => {
      if (!video.videoWidth) {
        status.textContent = "The camera is not ready yet.";
        return;
      }
      try {
        const dataUrl = drawToJpeg(video, {
          width: video.videoWidth,
          height: video.videoHeight,
        });
        finish(dataUrl);
      } catch (error) {
        finish(
          null,
          error instanceof PhotoPickError
            ? error
            : new PhotoPickError("failed", "Could not save that photo."),
        );
      }
    });

    fileButton.addEventListener("click", () => {
      void chooseImageFile()
        .then((file) => (file ? fileToDataUrl(file) : null))
        .then((uri) => {
          if (uri) finish(uri);
        })
        .catch((error: unknown) => {
          finish(
            null,
            error instanceof PhotoPickError
              ? error
              : new PhotoPickError("failed", "Could not read that image."),
          );
        });
    });

    cancelButton.addEventListener("click", () => finish(null));

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .catch(() =>
        navigator.mediaDevices.getUserMedia({ video: true, audio: false }),
      )
      .then((next) => {
        if (settled) {
          next.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = next;
        video.srcObject = next;
        captureButton.disabled = false;
        status.textContent = "Line up the photo, then capture it.";
      })
      .catch((error: unknown) => {
        if (settled) return;
        video.remove();
        captureButton.disabled = true;
        status.textContent = cameraFailureMessage(error);
      });
  });
}

/** Web photo pick. Library uses a file chooser. Camera uses the webcam, then a file. */
export async function pickPhoto(source: PhotoSource): Promise<string | null> {
  if (source === "library") {
    const file = await chooseImageFile();
    if (!file) return null;
    return fileToDataUrl(file);
  }
  return captureFromCamera();
}

export { PhotoPickError } from "@/lib/photoPick";
export type { PhotoSource } from "@/lib/photoPick";
