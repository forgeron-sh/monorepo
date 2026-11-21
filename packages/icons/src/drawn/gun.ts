import type { PixelIcon } from "../types";

// Pistol, side view: a solid slide and grip with a trigger-guard hole.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "gun",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".##########",
    ".##########",
    ".####..#",
    ".#######",
    ".####",
    "####",
    "####",
    "####",
  ],
};

export default icon;
