import type { PixelIcon } from "../types";

// A ticket with a percent sign: a discount ticket. Ticket of `ticket-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ticket-percent",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "############",
    "#..........#",
    "#...o..o...#",
    ".#....o...#",
    ".#...o....#",
    "#...o..o...#",
    "#..........#",
    "############",
  ],
};

export default icon;
