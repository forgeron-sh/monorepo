import type { PixelIcon } from "../types";

// Sliders: two tracks and their knobs in the secondary tone, symmetric by a half turn.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sliders-horizontal",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    ".......oo",
    ".######oo##",
    ".......oo",
    "",
    "",
    "...oo",
    ".##oo######",
    "...oo",
  ],
};

export default icon;
