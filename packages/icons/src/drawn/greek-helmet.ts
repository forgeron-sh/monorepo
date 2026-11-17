import type { PixelIcon } from "../types";

// Corinthian helmet: a solid helmet with a T-shaped opening, its crest in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "greek-helmet",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....oooo",
    "...oooooo",
    "..########",
    ".##########",
    ".##########",
    ".###....###",
    ".####..####",
    ".####..####",
    ".####..####",
    "..###..###",
    "...##..##",
  ],
};

export default icon;
