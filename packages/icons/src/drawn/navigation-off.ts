import type { PixelIcon } from "../types";

// Solid navigation arrow crossed out, the stroke in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "navigation-off",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "o",
    ".o........#",
    "..o....###",
    "...o.#####",
    "..##o.####",
    "..###o.##",
    ".....#o.#",
    "......#o",
    "......##o",
    "......##.o",
    "..........o",
    "...........o",
  ],
};

export default icon;
