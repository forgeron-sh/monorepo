import type { PixelIcon } from "../types";

// Sprout: the two leaves of `plant-01` in the secondary tone on a short stem rising from the
// ground.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "plant-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".ooo....ooo",
    ".oooo..oooo",
    "..ooo..ooo",
    "....o..o",
    ".....oo",
    ".....##",
    ".....##",
    ".....##",
    "############",
  ],
};

export default icon;
