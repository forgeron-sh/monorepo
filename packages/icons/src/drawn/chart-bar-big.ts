import type { PixelIcon } from "../types";

// Big bar chart: three wide bars with two-pixel gaps, the tallest in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "chart-bar-big",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    ".....oo",
    ".....oo",
    ".....oo",
    ".....oo..##",
    ".....oo..##",
    ".##..oo..##",
    ".##..oo..##",
    ".##..oo..##",
    ".##..oo..##",
    ".##..oo..##",
  ],
};

export default icon;
