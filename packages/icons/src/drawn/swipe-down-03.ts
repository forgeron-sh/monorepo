import type { PixelIcon } from "../types";

// Two touch points, each with an arrow down in the secondary tone: `swipe-up-03` turned upside down.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "swipe-down-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "..###..###",
    "..###..###",
    "..###..###",
    "",
    "...o....o",
    "...o....o",
    "...o....o",
    "...o....o",
    "...o....o",
    "...o....o",
    "..ooo..ooo",
    "...o....o",
  ],
};

export default icon;
