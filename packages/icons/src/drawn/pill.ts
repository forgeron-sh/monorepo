import type { PixelIcon } from "../types";

// Capsule: one half an outline, the other solid in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "pill",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "..####oooo",
    ".#....ooooo",
    "#.....oooooo",
    "#.....oooooo",
    ".#....ooooo",
    "..####oooo",
  ],
};

export default icon;
