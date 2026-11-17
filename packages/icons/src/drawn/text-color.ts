import type { PixelIcon } from "../types";

// Text color: a letter A over a bar of colour.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "text-color",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....####",
    "...##..##",
    "...##..##",
    "...######",
    "...##..##",
    "...##..##",
    "...##..##",
    "",
    ".oooooooooo",
    ".oooooooooo",
  ],
};

export default icon;
