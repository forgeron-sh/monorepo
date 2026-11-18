import type { PixelIcon } from "../types";

// Wi-Fi with its outer arc faded in the secondary tone: medium signal. Built on `wifi-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wifi-medium-signal",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "...oooooo",
    ".oo......oo",
    "o..........o",
    "",
    "...######",
    "..#......#",
    "",
    "",
    ".....##",
    ".....##",
  ],
};

export default icon;
