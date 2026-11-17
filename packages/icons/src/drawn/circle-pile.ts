import type { PixelIcon } from "../types";

// A pile of three solid discs, one resting on two.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "circle-pile",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".....##",
    "....####",
    "....####",
    ".....##",
    "..##....##",
    ".####..####",
    ".####..####",
    "..##....##",
  ],
};

export default icon;
