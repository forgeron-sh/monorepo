import type { PixelIcon } from "../types";

// School bell: a hand bell with a wooden handle, the clapper in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "school-bell-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    ".....##",
    "....####",
    "...#....#",
    "...#....#",
    "..#......#",
    "..#......#",
    ".##########",
    "",
    ".....oo",
  ],
};

export default icon;
