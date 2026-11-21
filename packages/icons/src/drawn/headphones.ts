import type { PixelIcon } from "../types";

// Headphones: a headband, the ear cups in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "headphones",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".ooo....ooo",
    ".ooo....ooo",
    ".ooo....ooo",
    ".ooo....ooo",
    ".ooo....ooo",
  ],
};

export default icon;
