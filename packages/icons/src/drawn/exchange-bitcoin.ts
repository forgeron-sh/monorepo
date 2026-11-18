import type { PixelIcon } from "../types";

// Exchange: an arrow right above, an arrow left below, a bitcoin sign between them in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "exchange-bitcoin",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".........#",
    ".##########",
    ".........#",
    "....ooo",
    "....o..o",
    "....ooo",
    "....o..o",
    "....ooo",
    "..#",
    ".##########",
    "..#",
  ],
};

export default icon;
