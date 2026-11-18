import type { PixelIcon } from "../types";

// Bread knife: a handle and a long blade with a serrated edge in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "knife-bread",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "",
    "....#######",
    "###.########",
    "###.########",
    "....o.o.o.o",
  ],
};

export default icon;
