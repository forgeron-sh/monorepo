import type { PixelIcon } from "../types";

// A PC tower case with two drive bays and the power button in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pc-case",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..########",
    "..#......#",
    "..#.####.#",
    "..#......#",
    "..#.####.#",
    "..#......#",
    "..#..oo..#",
    "..#..oo..#",
    "..#......#",
    "..########",
  ],
};

export default icon;
