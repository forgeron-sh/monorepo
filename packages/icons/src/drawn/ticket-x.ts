import type { PixelIcon } from "../types";

// Ticket with a cross in the secondary tone in place of the tear line. Built on `ticket-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ticket-x",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "############",
    "#..........#",
    "#...o..o...#",
    ".#...oo...#",
    ".#...oo...#",
    "#...o..o...#",
    "#..........#",
    "############",
  ],
};

export default icon;
