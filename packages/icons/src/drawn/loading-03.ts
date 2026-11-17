import type { PixelIcon } from "../types";

// Spinner: eight dots around a circle, the tail of the turn in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "loading-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....##",
    "..oo.##.##",
    "..oo....##",
    "",
    ".oo......##",
    ".oo......##",
    "",
    "..oo....##",
    "..oo.oo.##",
    ".....oo",
  ],
};

export default icon;
