import type { PixelIcon } from "../types";

// Nigiri sushi: a striped slice of fish, in the secondary tone, on a block of rice.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "sushi-01",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "",
    "...oooooo",
    ".oo..o.o.oo",
    "o...o.o....o",
    "############",
    "#..........#",
    "#..........#",
    ".##########",
  ],
};

export default icon;
