import type { PixelIcon } from "../types";

// Tablet in perspective: a flat disc with its score line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pills-tablet",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "...######",
    ".##......##",
    "#..oooooo..#",
    "###......###",
    "#..######..#",
    ".##......##",
    "...######",
  ],
};

export default icon;
