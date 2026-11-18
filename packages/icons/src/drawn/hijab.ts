import type { PixelIcon } from "../types";

// Hijab: a headscarf in the secondary tone framing the round face of the user head and falling to the shoulders.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "hijab",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "....oooo",
    "...o....o",
    "..o.####.o",
    "..o#....#o",
    "..o#....#o",
    "..o#....#o",
    "..o.####.o",
    ".o........o",
    ".o........o",
    "o..........o",
    "oooooooooooo",
  ],
};

export default icon;
