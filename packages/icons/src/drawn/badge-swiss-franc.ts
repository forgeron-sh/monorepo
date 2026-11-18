import type { PixelIcon } from "../types";

// Badge swiss franc: the badge rosette with a franc sign in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "badge-swiss-franc",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "..###..###",
    "..#..ooo.#",
    "..#..o...#",
    ".#...oo...#",
    ".#...o....#",
    "..#.ooo..#",
    "..#..o...#",
    "..###..###",
    ".....##",
  ],
};

export default icon;
