import type { PixelIcon } from "../types";

// The WPS Office mark: a bold W whose right arm rises higher, like a check mark.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "wps-office",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "..........##",
    "##...##...##",
    ".##..##..##",
    ".##.####.##",
    "..###..###",
    "..##....##",
  ],
};

export default icon;
