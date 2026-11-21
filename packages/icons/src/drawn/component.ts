import type { PixelIcon } from "../types";

// Four solid diamonds set in a diamond, the component mark of design tools.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "component",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....##",
    "....####",
    ".....##",
    "..##....##",
    ".####..####",
    "..##....##",
    ".....##",
    "....####",
    ".....##",
  ],
};

export default icon;
