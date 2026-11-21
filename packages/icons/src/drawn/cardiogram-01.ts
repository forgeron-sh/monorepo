import type { PixelIcon } from "../types";

// Cardiogram: a monitor on a stand, a heartbeat line across the screen in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cardiogram-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#....o...#",
    ".#...o.o..#",
    ".#ooo...oo#",
    ".#........#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
