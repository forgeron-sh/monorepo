import type { PixelIcon } from "../types";

// Signal bars, all unlit, with a cross: no signal. Bars of `signal`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "signal-no-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "#..#",
    ".##.......o",
    ".##.......o",
    "#..#...o..o",
    ".......o..o",
    "....o..o..o",
    "....o..o..o",
    ".o..o..o..o",
    ".o..o..o..o",
  ],
};

export default icon;
