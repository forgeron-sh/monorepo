import type { PixelIcon } from "../types";

// Flag on a pole.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "flag-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "..#......#",
    "..#......#",
    "..########",
    "..#",
    "..#",
    "..#",
    "..#",
    "..#",
  ],
};

export default icon;
