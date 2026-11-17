import type { PixelIcon } from "../types";

// Checklist: two check marks in the secondary tone, each with its line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "list-checks",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "....o",
    ".o.o..#####",
    "..o",
    "",
    "",
    "....o",
    ".o.o..#####",
    "..o",
  ],
};

export default icon;
