import type { PixelIcon } from "../types";

// Quoted text: a quote bar beside lines of text.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-quote",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".o..#######",
    ".o",
    ".o",
    ".o..####",
    ".o",
    ".o",
    ".o..#######",
    ".o",
    ".o",
    ".o..####",
  ],
};

export default icon;
