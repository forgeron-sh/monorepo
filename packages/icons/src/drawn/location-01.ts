import type { PixelIcon } from "../types";

// Location: the larger shared pin, a round head and a pointed tip, with a ring centred in its head in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
// Duotone (2026-11-17): the inner ring.
const icon: PixelIcon = {
  name: "location-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "..##....##",
    "..#..oo..#",
    ".#..o..o..#",
    ".#..o..o..#",
    ".#...oo...#",
    "..#......#",
    "...#....#",
    "....#..#",
    ".....##",
  ],
};

export default icon;
