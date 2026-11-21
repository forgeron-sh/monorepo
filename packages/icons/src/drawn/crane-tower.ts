import type { PixelIcon } from "../types";

// Tower crane: a mast, a long jib with its counterweight and a hanging load in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "crane-tower",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...#",
    "############",
    "##.#.....#",
    "##.#.....#",
    "...#....oo",
    "...#....oo",
    "...#",
    "...#",
    "...#",
    "..###",
  ],
};

export default icon;
