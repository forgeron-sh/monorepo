import type { PixelIcon } from "../types";

// Timeline list: two points on a vertical line, in the secondary tone, each with a label; the points of timeline.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "timeline-list",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..#",
    ".ooo..#####",
    ".o.o.#.....#",
    ".ooo..#####",
    "..#",
    "..#",
    "..#",
    ".ooo..#####",
    ".o.o.#.....#",
    ".ooo..#####",
    "..#",
    "..#",
  ],
};

export default icon;
