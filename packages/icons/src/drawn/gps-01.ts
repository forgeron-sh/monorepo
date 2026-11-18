import type { PixelIcon } from "../types";

// GPS: the shared map pin with its tip in a ring in the secondary tone, a position fix.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gps-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....####",
    "...#....#",
    "..#..##..#",
    "..#..##..#",
    "..#......#",
    "...#....#",
    "....#..#",
    "..oo.##.oo",
    ".o........o",
    "..oo....oo",
    "....oooo",
  ],
};

export default icon;
