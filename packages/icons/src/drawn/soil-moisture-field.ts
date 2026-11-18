import type { PixelIcon } from "../types";

// Soil moisture: a drop in the secondary tone over layers of soil.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "soil-moisture-field",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".....o",
    "....o.o",
    "...o...o",
    "..o.....o",
    "..o.....o",
    "..o.....o",
    "...o...o",
    "....ooo",
    "",
    ".##########",
    "",
    ".##..##..##",
  ],
};

export default icon;
