import type { PixelIcon } from "../types";

// Airship: long envelope with tail fins and a gondola in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "zeppelin",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "#",
    "##.######",
    ".##......##",
    "#..........#",
    ".##......##",
    "##.######",
    "#....oooo",
  ],
};

export default icon;
