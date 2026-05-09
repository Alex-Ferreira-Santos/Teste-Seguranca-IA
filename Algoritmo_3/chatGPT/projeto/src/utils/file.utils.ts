import path from "path";

export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf"
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function sanitizeFilename(filename: string): string {
  return path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, "_");
}