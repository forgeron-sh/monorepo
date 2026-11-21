import type { PixelIcon } from "../types";

// Strikethrough: a two-pixel S, symmetric by a half turn, crossed by a two-row bar in the
// secondary tone over its middle (monotone, the bar becomes the S's wide middle stroke).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-strikethrough",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..##....##",
    "..##",
    "..##",
    ".oooooooooo",
    ".oooooooooo",
    "........##",
    "........##",
    "..##....##",
    "...######",
  ],
};

export default icon;
