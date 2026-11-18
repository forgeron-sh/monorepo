import type { PixelIcon } from "../types";

// Palm tree: drooping fronds over a leaning trunk in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tree-palm",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..###..###",
    ".#...##...#",
    "#...#oo#...#",
    ".....oo",
    ".....oo",
    "......oo",
    "......oo",
    "......oo",
    "......oo",
    "....######",
  ],
};

export default icon;
