import type { PixelIcon } from "../types";

// Monitor with a notification dot at its upper right corner in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "monitor-dot",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".........oo",
    ".#######.oo",
    ".#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
    ".....##",
    ".....##",
    "...######",
  ],
};

export default icon;
