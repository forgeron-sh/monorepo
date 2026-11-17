import type { PixelIcon } from "../types";

// Map pin (solid, with a hole) on the left and a pen badge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "map-pin-pen",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".####",
    "######",
    "##..##",
    "##..##",
    "######",
    ".####....oo",
    "..##....ooo",
    "..##...ooo",
    "......ooo",
    "......o",
  ],
};

export default icon;
