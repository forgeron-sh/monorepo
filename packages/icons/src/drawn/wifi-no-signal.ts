import type { PixelIcon } from "../types";

// Wi-Fi drawn entirely in the secondary tone: no signal. Built on `wifi-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wifi-no-signal",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...oooooo",
    ".oo......oo",
    "o..........o",
    "",
    "...oooooo",
    "..o......o",
    "",
    "",
    ".....oo",
    ".....oo",
  ],
};

export default icon;
