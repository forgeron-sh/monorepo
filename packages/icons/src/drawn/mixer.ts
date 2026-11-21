import type { PixelIcon } from "../types";

// Stand mixer with its bowl on a base.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "mixer",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".########",
    "#........#",
    "#........#",
    "#..#####.#",
    "#..#...#",
    "#..#.oooooo",
    "#..#.oooooo",
    "#..#..oooo",
    "#..#",
    "##########",
  ],
};

export default icon;
