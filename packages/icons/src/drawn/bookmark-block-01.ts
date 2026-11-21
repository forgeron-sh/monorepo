import type { PixelIcon } from "../types";

// Bookmark block 01: the bookmark with a blocked sign in the shared badge corner.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "bookmark-block-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "..#......#",
    "..#......#",
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
