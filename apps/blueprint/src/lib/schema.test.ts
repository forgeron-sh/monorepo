import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { SCHEMA, SCHEMA_URL } from "@forgeron/blueprint/format";
import { describe, expect, it } from "vitest";
import { GET } from "../pages/schema/v1.json";

describe("/schema/v1.json", () => {
  it("serves the schema checked in at packages/blueprint/schema/blueprint.v1.json", async () => {
    const root = dirname(dirname(createRequire(import.meta.url).resolve("@forgeron/blueprint")));
    const file = JSON.parse(readFileSync(join(root, "schema", "blueprint.v1.json"), "utf8"));
    const response = await GET({} as Parameters<typeof GET>[0]);
    expect(response.headers.get("content-type")).toBe("application/schema+json; charset=utf-8");
    const served = await response.json();
    expect(served).toEqual(file);
    expect(served).toEqual(SCHEMA);
    expect(served.$id).toBe(SCHEMA_URL);
  });
});
