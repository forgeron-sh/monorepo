import type { PixelIcon } from "../types";

// House with a chimney on the gable roof and a centred door; variant of house-01.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "house-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "........##",
    ".....##.##",
    "...##..###",
    ".##......##",
    "############",
    ".#........#",
    ".#........#",
    ".#..####..#",
    ".#..#..#..#",
    ".#..#..#..#",
    ".####..####",
  ],
};

export default icon;
