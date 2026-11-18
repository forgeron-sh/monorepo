import type { PixelIcon } from "../types";

// The DeepSeek mark: a whale seen side on, its back and raised tail filled, its belly an open curve
// with an eye.
// 16×16: `#` primary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "deepseek",
  style: "pixel",
  grid: 16,
  // prettier-ignore
  rows: [
    "",
    "",
    ".......#",
    "..######..#...#",
    ".########..####",
    "##########.###",
    "#.###########",
    "#....####.###",
    "#.....###.###",
    "##.....######",
    ".##.....####",
    "..##.##..##",
    "...#########",
    ".....####",
  ],
};

export default icon;
