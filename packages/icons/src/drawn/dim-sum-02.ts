import type { PixelIcon } from "../types";

// A dumpling: a round bun with its pleats gathered at the top in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "dim-sum-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "....####",
    "..##.oo.##",
    ".#..o..o..#",
    "#..o....o..#",
    "#..........#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
