import type { PixelIcon } from "../types";

// Scissors lying on their side, blades pointing right, the handles in the secondary tone: `scissor` turned a quarter.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "scissor-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..oo",
    ".o..o.....#",
    ".o..o....#",
    "..oo.#..#",
    "......##",
    "......##",
    "..oo.#..#",
    ".o..o....#",
    ".o..o.....#",
    "..oo",
  ],
};

export default icon;
