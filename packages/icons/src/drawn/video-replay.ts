import type { PixelIcon } from "../types";

// Replay: the ring of `history` turning back on itself around a play triangle in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "video-replay",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    ".#...o....#",
    ".#...oo...#",
    ".#...ooo..#",
    "###..ooo..#",
    ".#...oo...#",
    ".....o....#",
    ".........#",
    "...######",
  ],
};

export default icon;
