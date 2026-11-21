import type { PixelIcon } from "../types";

// Footnote: a letter T with an asterisk, in the secondary tone, at its upper right, over a short rule.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-footnote",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "######...o",
    "#.##.#.o.o.o",
    "..##....ooo",
    "..##...o.o.o",
    "..##.....o",
    "..##",
    "..##",
    ".####",
    "",
    "######",
  ],
};

export default icon;
