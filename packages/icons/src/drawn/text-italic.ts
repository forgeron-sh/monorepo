import type { PixelIcon } from "../types";

// Italic I: two bars and a two-pixel stem slanting by one column twice, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-italic",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....######",
    "......##",
    "......##",
    "......##",
    ".....##",
    ".....##",
    "....##",
    "....##",
    "....##",
    "..######",
  ],
};

export default icon;
