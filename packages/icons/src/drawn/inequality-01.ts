import type { PixelIcon } from "../types";

// Inequality: a slanted stroke meeting a flat one at a point on the left, over a base line.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "inequality-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".........##",
    ".......##",
    ".....##",
    "...##",
    ".##",
    ".##########",
    "",
    "",
    ".oooooooooo",
  ],
};

export default icon;
