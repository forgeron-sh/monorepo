import type { PixelIcon } from "../types";

// Wi-Fi with both arcs faded in the secondary tone, only the dot strong: low signal. Built on `wifi-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wifi-low-signal",
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
    ".....##",
    ".....##",
  ],
};

export default icon;
