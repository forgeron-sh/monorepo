import type { PixelIcon } from "../types";

// A sun in the secondary tone and a snowflake.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sun-snow",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..ooo",
    ".ooooo",
    ".ooooo",
    "..ooo..#",
    ".....#.#.#",
    "......###",
    "....#######",
    "......###",
    ".....#.#.#",
    ".......#",
  ],
};

export default icon;
