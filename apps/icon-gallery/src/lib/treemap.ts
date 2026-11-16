// A squarified treemap (Bruls, Huizing and van Wijk, 2000): rectangles whose areas follow the
// values, as close to squares as the order allows.

export interface TreemapItem<T> {
  readonly value: number;
  readonly data: T;
}

export interface TreemapRect<T> {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly data: T;
}

/** The worst aspect ratio of a row of areas laid along a side of length `side`. */
function worst(row: readonly number[], side: number): number {
  const sum = row.reduce((a, b) => a + b, 0);
  const max = Math.max(...row);
  const min = Math.min(...row);
  return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
}

/** Lays `items` out in the rectangle `width` × `height`, largest first. */
export function squarify<T>(
  items: readonly TreemapItem<T>[],
  width: number,
  height: number,
): TreemapRect<T>[] {
  const positive = items.filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
  const total = positive.reduce((a, i) => a + i.value, 0);
  if (total === 0 || width <= 0 || height <= 0) return [];
  const scale = (width * height) / total;
  const areas = positive.map((i) => i.value * scale);
  const out: TreemapRect<T>[] = [];
  let x = 0;
  let y = 0;
  let w = width;
  let h = height;
  let start = 0;

  const place = (from: number, to: number) => {
    const row = areas.slice(from, to);
    const sum = row.reduce((a, b) => a + b, 0);
    if (w >= h) {
      // A column on the left, as wide as the row needs.
      const colW = sum / h;
      let cy = y;
      row.forEach((area, k) => {
        const rh = area / colW;
        out.push({ x, y: cy, w: colW, h: rh, data: positive[from + k]!.data });
        cy += rh;
      });
      x += colW;
      w -= colW;
    } else {
      const rowH = sum / w;
      let cx = x;
      row.forEach((area, k) => {
        const rw = area / rowH;
        out.push({ x: cx, y, w: rw, h: rowH, data: positive[from + k]!.data });
        cx += rw;
      });
      y += rowH;
      h -= rowH;
    }
  };

  while (start < areas.length) {
    const side = Math.min(w, h);
    let end = start + 1;
    while (
      end < areas.length &&
      worst(areas.slice(start, end + 1), side) <= worst(areas.slice(start, end), side)
    ) {
      end++;
    }
    place(start, end);
    start = end;
  }
  return out;
}
