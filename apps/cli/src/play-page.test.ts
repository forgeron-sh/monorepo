import { describe, expect, it } from "vitest";
import { PLAYGROUND_HTML } from "./play-page";

describe("the playground page", () => {
  it("has a script that parses: an escape slipped into the template would break the whole page", () => {
    const script = /<script>([\s\S]*)<\/script>/.exec(PLAYGROUND_HTML)![1]!;
    // Wrapped in an async function: the script awaits at its top level.
    expect(() => new Function(`return async () => {${script}}`)).not.toThrow();
  });
});
