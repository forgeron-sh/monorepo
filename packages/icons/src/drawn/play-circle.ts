import type { PixelIcon } from "../types";

// Play in a ring: the ring of `clock-01`, a small solid triangle in the secondary tone, one column
// right of the centre (optical centre).
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "play-circle",
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
    ".#...ooo..#",
    ".#...oo...#",
    ".#...o....#",
    "..#......#",
    "...######",
  ],
};

export default icon;
