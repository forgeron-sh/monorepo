import type { PixelIcon } from "../types";

// Book dashed: the book with its cover drawn as a dashed outline.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "book-dashed",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..oo##..##",
    "..oo.....#",
    "..oo",
    "..oo.....#",
    "..oo.....#",
    "..oo",
    "..oo.....#",
    "..oo.....#",
    "..oo",
    "..oo##..##",
  ],
};

export default icon;
