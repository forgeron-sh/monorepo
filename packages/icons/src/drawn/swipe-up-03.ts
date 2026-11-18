import type { PixelIcon } from "../types";

// Two touch points, each with an arrow up in the secondary tone: a two-finger swipe up; `swipe-right-03` turned.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "swipe-up-03",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "...o....o",
    "..ooo..ooo",
    "...o....o",
    "...o....o",
    "...o....o",
    "...o....o",
    "...o....o",
    "...o....o",
    "",
    "..###..###",
    "..###..###",
    "..###..###",
  ],
};

export default icon;
