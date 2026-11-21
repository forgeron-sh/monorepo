import type { PixelIcon } from "../types";

// Presentation with a bar chart: `presentation-01` with three rising bars in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "presentation-bar-chart-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##########",
    "..#......#",
    "..#....o.#",
    "..#..o.o.#",
    "..#o.o.o.#",
    "..#o.o.o.#",
    "..########",
    ".....##",
    "....#..#",
    "...#....#",
  ],
};

export default icon;
