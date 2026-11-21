import type { PixelIcon } from "../types";

// Cut here: small scissors pointing right and a dashed line in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "scissors-line-dashed",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##.....#",
    "#..#...#",
    "#..##.#",
    ".##..#",
    ".....#..o.oo",
    ".....#..o.oo",
    ".##..#",
    "#..##.#",
    "#..#...#",
    ".##.....#",
  ],
};

export default icon;
