import type { PixelIcon } from "../types";

// Projector screen: a screen hanging from its roller, a pull cord in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "presentation-03",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "############",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".#........#",
    ".##########",
    "......o",
    "......o",
    ".....ooo",
  ],
};

export default icon;
