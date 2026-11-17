import type { PixelIcon } from "../types";

// Approximately equal: two waves, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "approximately-equal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "...##",
    "..#..##..#",
    ".......##",
    "",
    "",
    "...##",
    "..#..##..#",
    ".......##",
  ],
};

export default icon;
