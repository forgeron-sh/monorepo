import type { PixelIcon } from "../types";

// Two matchsticks standing side by side, their heads in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "matches",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..oo....oo",
    ".oooo..oooo",
    ".oooo..oooo",
    "..##....##",
    "..##....##",
    "..##....##",
    "..##....##",
    "..##....##",
    "..##....##",
    "..##....##",
  ],
};

export default icon;
