import { readBlueprint, schemaErrors } from "@forgeron/blueprint/format";
import { describe, expect, it } from "vitest";
import { EXAMPLE } from "./example";
import { exampleStillAsync } from "./home";

describe("the home page's example", () => {
  it("is a valid file", async () => {
    expect(schemaErrors(EXAMPLE)).toEqual([]);
    const lib = await readBlueprint(EXAMPLE);
    expect([...lib.scenes.keys()]).toEqual(["rack"]);
  });

  it("draws at build time", async () => {
    const { svg, drawn } = await exampleStillAsync();
    expect(drawn).toBeGreaterThan(500);
    expect(svg).toContain("var(--accent");
  });
});
