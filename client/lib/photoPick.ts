export type PhotoSource = "library" | "camera";

export class PhotoPickError extends Error {
  readonly reason: "permission" | "unavailable" | "failed";

  constructor(
    reason: "permission" | "unavailable" | "failed",
    message: string,
  ) {
    super(message);
    this.name = "PhotoPickError";
    this.reason = reason;
  }
}
