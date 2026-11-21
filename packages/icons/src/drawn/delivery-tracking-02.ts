import type { PixelIcon } from "../types";

// Shipment tracking: a parcel, a route and a location pin in the secondary tone.
// 12×12: `#` primary tone, `o` secondary tone. Drawn on 2026-11-18.
const icon: PixelIcon = {
  name: "delivery-tracking-02",
  style: "pixel",
  grid: 12,
  // prettier-ignore
  rows: [
    ".......ooo",
    "......o...o",
    "......o...o",
    ".......o.o",
    "........o",
    "",
    "........#",
    "#####...#",
    "#...#...#",
    "#...#####",
    "#...#",
    "#####",
  ],
};

export default icon;
