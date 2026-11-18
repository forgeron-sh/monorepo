import type { PixelIcon } from "../types";

// A solid table tennis bat with the ball in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "table-tennis-bat",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...####..oo",
    "..######.oo",
    ".########",
    ".########",
    ".########",
    ".########",
    "..######",
    "...####",
    ".....##",
    ".....##",
    ".....##",
  ],
};

export default icon;
