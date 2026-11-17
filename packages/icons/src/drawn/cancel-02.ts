import type { PixelIcon } from "../types";

// Heavy cross: two diagonals of two-pixel runs, symmetric both ways, the bold counterpart of
// `cancel-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "cancel-02",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "..##....##",
    "...##..##",
    "....####",
    ".....##",
    "....####",
    "...##..##",
    "..##....##",
    ".##......##",
  ],
};

export default icon;
