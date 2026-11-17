import type { PixelIcon } from "../types";

// Sign in: an arrow in the secondary tone entering a door frame open to the left (`logout-01` reversed).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "login-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#####",
    "..........#",
    ".....o....#",
    "......o...#",
    ".ooooooo..#",
    "......o...#",
    ".....o....#",
    "..........#",
    "..........#",
    "......#####",
  ],
};

export default icon;
