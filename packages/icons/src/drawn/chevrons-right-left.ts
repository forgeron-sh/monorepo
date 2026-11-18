import type { PixelIcon } from "../types";

// Chevrons right left: two chevrons pointing towards each other, to collapse sideways.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chevrons-right-left",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".##......##",
    "..##....##",
    "...##..##",
    "...##..##",
    "..##....##",
    ".##......##",
  ],
};

export default icon;
