import type { PixelIcon } from "../types";

// Cigarette: a filter and a body, a wisp of smoke above the lit end in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cigarette",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    ".........o",
    "..........o",
    ".........o",
    "",
    "..#########",
    "..#.#.....#",
    "..#########",
  ],
};

export default icon;
