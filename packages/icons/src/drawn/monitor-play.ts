import type { PixelIcon } from "../types";

// Monitor of `monitor-pause` with a play triangle on its screen in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "monitor-play",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    ".#........#",
    ".#...o....#",
    ".#...oo...#",
    ".#...ooo..#",
    ".#...ooo..#",
    ".#...oo...#",
    ".#...o....#",
    ".##########",
    ".....##",
    "...######",
  ],
};

export default icon;
