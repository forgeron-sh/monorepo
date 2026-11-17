import type { PixelIcon } from "../types";

// Plane ticket: a ticket with notched sides and a small airplane, in the secondary tone, on it; the ticket of ticket-01, one row taller.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-17.
const icon: PixelIcon = {
  name: "tickets-plane",
  implemented: true,
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    "",
    "############",
    "#..........#",
    "#.....o....#",
    "#...ooooo..#",
    ".#....o...#",
    ".#....o...#",
    "#....ooo...#",
    "#..........#",
    "#..........#",
    "############",
  ],
};

export default icon;
