import type { PixelIcon } from "../types";

// Curtains on a rod, each drape held back by a tie in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "curtains",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "############",
    ".###....###",
    ".###....###",
    ".##......##",
    ".##......##",
    ".oo......oo",
    ".##......##",
    ".###....###",
    ".###....###",
    ".####..####",
  ],
};

export default icon;
