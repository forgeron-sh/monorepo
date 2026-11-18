import type { PixelIcon } from "../types";

// Kayak: a long pointed hull, a double paddle above it in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "kayak",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "oo",
    "oo",
    "..o",
    "...o",
    "....o",
    ".....o",
    "......o..oo",
    ".......o.oo",
    "..########",
    "##........##",
    "..########",
  ],
};

export default icon;
