import type { PixelIcon } from "../types";

// Bell with a rounded top and a wide rim, the clapper in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "notification-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...#....#",
    "..#......#",
    "..#......#",
    "..#......#",
    ".#........#",
    ".#........#",
    ".##########",
    "",
    ".....oo",
  ],
};

export default icon;
