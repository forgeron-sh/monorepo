import type { PixelIcon } from "../types";

// Gravity: a ball falling down an arrow in the secondary tone onto the ground.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "gravity",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....##",
    "...####",
    "...####",
    "....##",
    "",
    "....oo",
    "....oo",
    "..oooooo",
    "...oooo",
    "....oo",
    "############",
  ],
};

export default icon;
