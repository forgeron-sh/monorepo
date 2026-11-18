import type { PixelIcon } from "../types";

// Soda can: a tapered lid with its pull tab in the secondary tone, a straight body.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "soda-can",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....ooo",
    "...######",
    "..#......#",
    "..########",
    "..#......#",
    "..#......#",
    "..#......#",
    "..#......#",
    "..########",
    "..#......#",
    "...######",
  ],
};

export default icon;
