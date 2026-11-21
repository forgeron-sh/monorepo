import type { PixelIcon } from "../types";

// Installing updates: a gear in the secondary tone above an open tray.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "installing-updates-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....oo",
    "...oooooo",
    "...oo..oo",
    ".ooo....ooo",
    ".ooo....ooo",
    "...oo..oo",
    "...oooooo",
    ".....oo",
    "#..........#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
