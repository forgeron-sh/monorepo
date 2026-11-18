import type { PixelIcon } from "../types";

// Sheriff's badge: the five-pointed star of `star` with a round stamp at its centre in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "sheriff-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "....#..#",
    "....#..#",
    "####....####",
    ".#...oo...#",
    "..#..oo..#",
    "..#......#",
    ".#...##...#",
    ".#..#..#..#",
    ".###....###",
  ],
};

export default icon;
