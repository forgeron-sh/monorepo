import type { PixelIcon } from "../types";

// Waterfall chart going down: a full bar, a floating drop, the final bar in the secondary tone, over a baseline.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "waterfall-down-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".##..##",
    ".##..##",
    ".##..##",
    ".##..##",
    ".##......oo",
    ".##......oo",
    ".##......oo",
    ".##......oo",
    "",
    ".##########",
  ],
};

export default icon;
