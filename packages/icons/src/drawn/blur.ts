import type { PixelIcon } from "../types";

// A blur: a disc of square dots, solid in the middle, fading to the secondary tone outside.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "blur",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "....oo.oo",
    "....oo.oo",
    "",
    ".oo.##.##.oo",
    ".oo.##.##.oo",
    "",
    ".oo.##.##.oo",
    ".oo.##.##.oo",
    "",
    "....oo.oo",
    "....oo.oo",
  ],
};

export default icon;
