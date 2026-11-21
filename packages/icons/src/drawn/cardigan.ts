import type { PixelIcon } from "../types";

// Cardigan: a long-sleeved knit with a V neck and buttons in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cardigan",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##..##",
    ".##.#..#.##",
    "#....##....#",
    "###......###",
    "..#..oo..#",
    "..#......#",
    "..#..oo..#",
    "..#......#",
    "..#......#",
    "..########",
  ],
};

export default icon;
