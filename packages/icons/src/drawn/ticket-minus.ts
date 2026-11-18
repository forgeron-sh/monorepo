import type { PixelIcon } from "../types";

// Ticket with a minus in the secondary tone in place of the tear line. Built on `ticket-01`.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "ticket-minus",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "",
    "############",
    "#..........#",
    "#..........#",
    ".#.oooooo.#",
    ".#.oooooo.#",
    "#..........#",
    "#..........#",
    "############",
  ],
};

export default icon;
