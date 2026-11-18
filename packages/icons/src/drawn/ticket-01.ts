import type { PixelIcon } from "../types";

// Drawn for the home page's catalog, 12×12: `#` primary tone, `o` secondary tone.
const icon: PixelIcon = {
  name: "ticket-01",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "############",
    "#....o.....#",
    "#....o.....#",
    ".#...o....#",
    ".#...o....#",
    "#....o.....#",
    "#....o.....#",
    "############",
  ],
};

export default icon;
