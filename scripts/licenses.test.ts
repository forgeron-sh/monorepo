import { describe, expect, it } from "vitest";
import { isAllowed, licenseOf, problemsOf } from "./licenses";

describe("licence guard", () => {
  it("accepts permissive licences and expressions where one side is permitted", () => {
    const ok = [
      "MIT",
      "Apache-2.0",
      "ISC",
      "(MIT OR GPL-3.0)",
      "(MIT AND ISC)",
      "BSD-3-Clause",
      "MIT OR (GPL-2.0 AND BSD-2-Clause)",
    ];
    expect(ok.filter((l) => !isAllowed(l))).toEqual([]);
  });

  it("refuses copyleft, source-available and unknown terms", () => {
    const bad = [
      "GPL-3.0",
      "LGPL-3.0-or-later",
      "AGPL-3.0",
      "SSPL-1.0",
      "MPL-2.0",
      "(MIT AND GPL-3.0)",
      "BUSL-1.1",
      "UNLICENSED",
      "Apache-2.0 WITH LLVM-exception",
      "",
    ];
    expect(bad.filter((l) => isAllowed(l))).toEqual([]);
  });

  it("reads the licence from any manifest shape", () => {
    expect(licenseOf({ license: "MIT" })).toBe("MIT");
    expect(licenseOf({ license: { type: "ISC" } })).toBe("ISC");
    expect(licenseOf({ licenses: [{ type: "MIT" }, { type: "Apache-2.0" }] })).toBe(
      "(MIT OR Apache-2.0)",
    );
    expect(licenseOf({})).toBeUndefined();
  });

  it("reports what is outside, missing, or a workspace package with another licence", () => {
    const problems = problemsOf(
      new Map([
        ["ok@1.0.0", { name: "ok", version: "1.0.0", license: "MIT" }],
        ["bad@1.0.0", { name: "bad", version: "1.0.0", license: "GPL-3.0" }],
        ["none@1.0.0", { name: "none", version: "1.0.0" }],
        ["@forgeron/x@0.0.0", { name: "@forgeron/x", version: "0.0.0", license: "MIT" }],
        ["@forgeron/y@0.0.0", { name: "@forgeron/y", version: "0.0.0", license: "Apache-2.0" }],
        [
          "lightningcss-linux-x64-gnu@1.0.0",
          { name: "lightningcss-linux-x64-gnu", version: "1.0.0", license: "MPL-2.0" },
        ],
      ]),
    );
    expect(problems).toHaveLength(3);
    expect(problems.join("\n")).toContain("bad@1.0.0: GPL-3.0");
    expect(problems.join("\n")).toContain("none@1.0.0: no licence");
    expect(problems.join("\n")).toContain("@forgeron/x");
  });
});
