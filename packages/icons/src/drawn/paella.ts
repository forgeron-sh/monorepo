import type { PixelIcon } from "../types";

// Paella pan from the side: a wide shallow pan with two handles, the rice in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "paella",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    "...oooooo",
    "..oooooooo",
    "############",
    "..#......#",
    "...######",
  ],
};

export default icon;
