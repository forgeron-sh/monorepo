import type { PixelIcon } from "../types";

// Compare, in the style of the git icons: two branches pointing at each other, symmetric by a half
// turn, one in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "git-compare",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".###...o",
    ".#.#..oooo",
    ".###...o.o",
    "..#......o",
    "..#......o",
    "..#......o",
    "..#......o",
    "..#.#...ooo",
    "..####..o.o",
    "....#...ooo",
  ],
};

export default icon;
