import type { PixelIcon } from "../types";

// Frisbee: a flat disc seen in perspective, its rim ring in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "frisbee",
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
    "#..........#",
    ".##......##",
    "...######",
  ],
};

export default icon;
