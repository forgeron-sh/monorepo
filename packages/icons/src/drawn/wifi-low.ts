import type { PixelIcon } from "../types";

// Wi-Fi with one arc above the dot: low strength. Built on `wifi-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "wifi-low",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
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
