/** Presentation of downloadable files: sizes and checksums. */

/** `11496` → `11.5 kB` (SI units, as file sizes are announced). */
export function formatBytes(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1000).toFixed(1)} kB`;
  return `${(bytes / 1_000_000).toFixed(2)} MB`;
}

/** Lowercase hexadecimal of a digest. */
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** A long hash cut for display: the first and last characters, the full value stays copyable. */
export function shortHash(hex: string, keep = 8): string {
  return hex.length <= keep * 2 + 1 ? hex : `${hex.slice(0, keep)}…${hex.slice(-keep)}`;
}
