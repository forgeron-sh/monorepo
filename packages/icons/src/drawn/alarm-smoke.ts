import type { PixelIcon } from "../types";

// Smoke alarm: a dome on the ceiling, the smoke rising into it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "alarm-smoke",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    "..#......#",
    "...######",
    "",
    "...o..o..o",
    "..o..o..o",
    "...o..o..o",
    "..o..o..o",
  ],
};

export default icon;
