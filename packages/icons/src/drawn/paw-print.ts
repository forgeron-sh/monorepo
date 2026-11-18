import type { PixelIcon } from "../types";

// A paw print: four toe pads over the main pad.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "paw-print",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...##..##",
    "...##..##",
    "",
    "##........##",
    "##........##",
    "....####",
    "...######",
    "..########",
    "..########",
    "...##..##",
  ],
};

export default icon;
