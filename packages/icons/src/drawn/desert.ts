import type { PixelIcon } from "../types";

// Desert: a sun in the secondary tone over a dune and the ground line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "desert",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "........oo",
    ".......oooo",
    ".......oooo",
    "........oo",
    "",
    "....####",
    "..##....##",
    "##........##",
    "",
    "",
    "############",
  ],
};

export default icon;
