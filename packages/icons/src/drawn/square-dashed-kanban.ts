import type { PixelIcon } from "../types";

// Three kanban columns of different heights in the secondary tone in `square-dashed`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "square-dashed-kanban",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##..##..##",
    ".#........#",
    "...o.o.o",
    "...o.o.o",
    ".#.o.o.o..#",
    ".#.o...o..#",
    "...o...o",
    ".......o",
    ".#........#",
    ".##..##..##",
  ],
};

export default icon;
