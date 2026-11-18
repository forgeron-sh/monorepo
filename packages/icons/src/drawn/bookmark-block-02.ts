import type { PixelIcon } from "../types";

// Bookmark block 02: the labelled bookmark with a blocked sign in the shared badge corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bookmark-block-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...######",
    "..#......#",
    "..#......#",
    "..#.####.#",
    "..#......#",
    "..#",
    "..#.....ooo",
    "..#..#.o..oo",
    "..#.#..o.o.o",
    "..##...oo..o",
    "........ooo",
  ],
};

export default icon;
