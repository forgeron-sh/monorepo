import { describe, expect, it } from "vitest";
import { copyrightNotice, FONT_LICENCE, licenceFile } from "../config/licence";
import { classify, codepointLabel, groupCodepoints, missingChars } from "./charmap";
import { formatBytes, shortHash, toHex } from "./files";
import { cellsPath, embolden, inkBounds, stretchColumns, windingAt } from "./raster";
import { isPixelPerfect, pixelPerfectSizes, pixelScale, pixelStep, snapSize } from "./sizes";
import { crc32, dosDateTime, zipStore } from "./zip";

describe("pixel-perfect sizes", () => {
  it("steps by 10 px when a pixel is 100 units of a 1000-unit em, by 20 px at 50 units", () => {
    expect(pixelStep(1000, 100)).toBe(10);
    expect(pixelStep(1000, 50)).toBe(20);
    expect(pixelStep(2048, 256)).toBe(8);
  });

  it("measures one font pixel in CSS px", () => {
    expect(pixelScale(30, 1000, 100)).toBe(3);
    expect(pixelScale(25, 1000, 100)).toBe(2.5);
  });

  it("tells whole pixels apart, on the screen's own pixels", () => {
    expect(isPixelPerfect(30, 1000, 100)).toBe(true);
    expect(isPixelPerfect(25, 1000, 100)).toBe(false);
    expect(isPixelPerfect(25, 1000, 100, 2)).toBe(true);
    expect(isPixelPerfect(5, 1000, 100)).toBe(false);
    expect(isPixelPerfect(30, 1000, 50)).toBe(false);
    expect(isPixelPerfect(40, 1000, 50)).toBe(true);
  });

  it("lists and snaps sizes", () => {
    expect(pixelPerfectSizes(10, 8, 42)).toEqual([10, 20, 30, 40]);
    expect(pixelPerfectSizes(20, 0, 60)).toEqual([20, 40, 60]);
    expect(snapSize(34, 10)).toBe(30);
    expect(snapSize(35, 10)).toBe(40);
    expect(snapSize(3, 10)).toBe(10);
  });
});

describe("character map", () => {
  it("groups by Unicode properties", () => {
    expect(classify(0x41)).toBe("uppercase");
    expect(classify(0x61)).toBe("lowercase");
    expect(classify(0xe9)).toBe("accented");
    expect(classify(0xc7)).toBe("accented");
    expect(classify(0x37)).toBe("figures");
    expect(classify(0x2019)).toBe("punctuation");
    expect(classify(0x20ac)).toBe("symbols");
    expect(classify(0x2192)).toBe("symbols");
    expect(classify(0x20)).toBe("space");
  });

  it("orders groups and drops empty ones", () => {
    expect(groupCodepoints([0x62, 0x41, 0x61, 0x31])).toEqual([
      { group: "uppercase", cps: [0x41] },
      { group: "lowercase", cps: [0x61, 0x62] },
      { group: "figures", cps: [0x31] },
    ]);
  });

  it("labels code points", () => {
    expect(codepointLabel(0x41)).toBe("U+0041");
    expect(codepointLabel(0x20ac)).toBe("U+20AC");
  });

  it("finds the characters a text needs and the font lacks", () => {
    expect(missingChars("a{b}\nä{", new Set([0x61, 0x62]))).toEqual(["{", "}", "ä"]);
  });
});

describe("raster helpers", () => {
  it("winds around a square and not outside it", () => {
    const square = [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ] as const,
    ];
    expect(windingAt(square, 5, 5)).not.toBe(0);
    expect(windingAt(square, 15, 5)).toBe(0);
  });

  it("emboldens as the glyph table does, and on finer grids", () => {
    expect(embolden(["#.#", ".#."])).toEqual(["####", ".##."]);
    expect(stretchColumns(["#."], 2)).toEqual(["##.."]);
    expect(embolden(stretchColumns(["#."], 2))).toEqual(["###.."]);
  });

  it("finds the ink box", () => {
    expect(inkBounds(["...", ".#.", "..#"])).toEqual({ left: 1, right: 2, top: 1, bottom: 2 });
    expect(inkBounds(["..."])).toBeNull();
  });

  it("draws runs of cells as one rectangle each", () => {
    expect(cellsPath(["##.#"], 10)).toBe("M0 0h20v10h-20zM30 0h10v10h-10z");
    expect(cellsPath([".", "#"], 2, 1, 1)).toBe("M1 3h2v2h-2z");
  });
});

describe("files", () => {
  it("formats sizes in SI units", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(11496)).toBe("11.5 kB");
    expect(formatBytes(2_500_000)).toBe("2.50 MB");
  });

  it("writes and shortens hashes", () => {
    expect(toHex(new Uint8Array([0, 15, 255]))).toBe("000fff");
    expect(shortHash("0123456789abcdef0123456789", 4)).toBe("0123…6789");
    expect(shortHash("abc", 4)).toBe("abc");
  });
});

describe("zip", () => {
  it("computes the standard CRC-32 check value", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("writes stored entries with a central directory, the same bytes every time", () => {
    const data = new TextEncoder().encode("hello");
    const a = zipStore([{ name: "a/b.txt", data }], dosDateTime(2026, 11, 16));
    const b = zipStore([{ name: "a/b.txt", data }], dosDateTime(2026, 11, 16));
    expect(a).toEqual(b);
    const v = new DataView(a.buffer);
    expect(v.getUint32(0, true)).toBe(0x04034b50);
    expect(v.getUint32(14, true)).toBe(crc32(data));
    const end = a.length - 22;
    expect(v.getUint32(end, true)).toBe(0x06054b50);
    expect(v.getUint16(end + 10, true)).toBe(1);
    const central = v.getUint32(end + 16, true);
    expect(v.getUint32(central, true)).toBe(0x02014b50);
    expect(new TextDecoder().decode(a.subarray(30, 37))).toBe("a/b.txt");
    expect(new TextDecoder().decode(a.subarray(37, 42))).toBe("hello");
  });

  it("encodes DOS dates", () => {
    expect(dosDateTime(1980, 1, 1)).toEqual({ date: 33, time: 0 });
  });
});

describe("licence", () => {
  it("names forgeron.sh as the holder, with no Reserved Font Name", () => {
    expect(FONT_LICENCE.spdx).toBe("OFL-1.1");
    expect(FONT_LICENCE.reservedFontName).toBeNull();
    expect(copyrightNotice(FONT_LICENCE)).toBe("Copyright (c) 2026 forgeron.sh");
    expect(copyrightNotice({ ...FONT_LICENCE, holder: "X", reservedFontName: "Y" })).toBe(
      "Copyright (c) 2026 X,\nwith Reserved Font Name Y.",
    );
  });

  it("heads the licence text with the notice and the OFL's standard lines", () => {
    const file = licenceFile(FONT_LICENCE, "BODY\n\n");
    expect(file.startsWith("Copyright (c) 2026 forgeron.sh\n")).toBe(true);
    expect(file).not.toContain("to be confirmed");
    expect(file).toContain("licensed under the SIL Open Font License, Version 1.1.");
    expect(file.endsWith("BODY\n")).toBe(true);
  });
});
