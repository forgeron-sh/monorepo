import type { PixelIcon } from "../types";

// Underline: a two-pixel U over an underline in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-underline",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..##....##",
    "..##....##",
    "..##....##",
    "..##....##",
    "..##....##",
    "..##....##",
    "...######",
    "",
    "",
    ".oooooooooo",
  ],
};

export default icon;
