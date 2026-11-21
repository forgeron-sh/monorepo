import type { PixelIcon } from "../types";

// Quran open: an open book under a crescent finial in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "quran-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....o..o",
    ".....oo",
    "",
    ".####..####",
    "#....##....#",
    "#....##....#",
    "#....##....#",
    "#....##....#",
    "#....##....#",
    "#....##....#",
    "############",
  ],
};

export default icon;
