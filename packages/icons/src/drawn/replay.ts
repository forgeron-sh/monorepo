import type { PixelIcon } from "../types";

// Replay: the open circle of `rotate-left-01` with a play triangle inside in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "replay",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#........#",
    "###..o....#",
    ".#...oo...#",
    ".....ooo..#",
    ".....oo...#",
    ".....o....#",
    ".........#",
    "......###",
  ],
};

export default icon;
