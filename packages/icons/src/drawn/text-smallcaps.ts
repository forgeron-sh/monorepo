import type { PixelIcon } from "../types";

// Small caps: a capital T next to a smaller capital T, in the bold letter style of text.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-smallcaps",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "######",
    "#.##.#",
    "..##",
    "..##",
    "..##..######",
    "..##..#.##.#",
    "..##....##",
    "..##....##",
    ".####..####",
  ],
};

export default icon;
