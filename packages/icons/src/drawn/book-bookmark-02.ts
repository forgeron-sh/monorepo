import type { PixelIcon } from "../types";

// Book with a ribbon bookmark in the secondary tone hanging out of the bottom.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "book-bookmark-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#.#....#",
    "..#.#....#",
    "..#.#....#",
    "..#.#....#",
    "..#.#....#",
    "..#.#....#",
    "..########",
    "......ooo",
    "......o.o",
  ],
};

export default icon;
