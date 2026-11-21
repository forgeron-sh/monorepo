import type { PixelIcon } from "../types";

// Single eighth note: a solid head, a stem and a curling flag.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "music-note-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "......#",
    "......##",
    "......#.#",
    "......#..#",
    "......#..#",
    "......#.#",
    "......#",
    "...####",
    "..#####",
    "...###",
  ],
};

export default icon;
