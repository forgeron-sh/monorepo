import type { PixelIcon } from "../types";

// Tasbih: a loop of prayer beads closing on a bead with a tassel in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "tasbih",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...##..##",
    "...##..##",
    ".##......##",
    ".##......##",
    "",
    ".##......##",
    ".##......##",
    "...##..##",
    "...##oo##",
    ".....oo",
    "....oooo",
    "....oooo",
  ],
};

export default icon;
