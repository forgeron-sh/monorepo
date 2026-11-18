import type { PixelIcon } from "../types";

// Dark mode: a circle with its left half filled.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dark-mode",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..####...#",
    ".#####....#",
    ".#####....#",
    ".#####....#",
    ".#####....#",
    ".#####....#",
    ".#####....#",
    "..####...#",
    "...######",
  ],
};

export default icon;
