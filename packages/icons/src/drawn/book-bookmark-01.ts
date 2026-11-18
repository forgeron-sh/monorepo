import type { PixelIcon } from "../types";

// Book with its page block curling out at the bottom and a notched ribbon bookmark in the secondary tone hanging from the top edge.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "book-bookmark-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#######",
    "..#.ooo..#",
    "..#.ooo..#",
    "..#.ooo..#",
    "..#.o.o..#",
    "..#......#",
    "..#......#",
    "..#.######",
    "..#.#",
    "...#######",
  ],
};

export default icon;
