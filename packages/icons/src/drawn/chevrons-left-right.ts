import type { PixelIcon } from "../types";

// Chevrons left right: two chevrons pointing away from each other, to expand sideways.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chevrons-left-right",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "...##..##",
    "..##....##",
    ".##......##",
    ".##......##",
    "..##....##",
    "...##..##",
  ],
};

export default icon;
