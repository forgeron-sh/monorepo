import type { PixelIcon } from "../types";

// Agenda view: two wide rounded panels stacked one above the other.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "view-agenda",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    ".#........#",
    ".#........#",
    "..########",
    "",
    "",
    "..########",
    ".#........#",
    ".#........#",
    "..########",
  ],
};

export default icon;
