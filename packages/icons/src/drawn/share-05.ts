import type { PixelIcon } from "../types";

// Share: an arrow in the secondary tone rising out of an open box.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "share-05",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    "....oooo",
    ".....oo",
    ".###.oo.###",
    ".#...oo...#",
    ".#...oo...#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
  ],
};

export default icon;
