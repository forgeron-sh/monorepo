import type { PixelIcon } from "../types";

// Quill writing: `feather` over a written line in the primary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "quill-write-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".......####",
    ".....##.o.#",
    "....#..o.#",
    "...#..o.#",
    "...#.o.#",
    "...#o.#",
    "...o##",
    "..o",
    ".o",
    "o",
    "..########",
  ],
};

export default icon;
