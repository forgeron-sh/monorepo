import { describe, expect, it } from "vitest";
import { playgroundHtml } from "./page";

const html = (base = "", manifestUrl = "/_play/manifest") => playgroundHtml({ base, manifestUrl });

describe("the playground page", () => {
  it("has a script that parses: an escape slipped into the template would break the whole page", () => {
    const script = /<script>([\s\S]*)<\/script>/.exec(html())![1]!;
    // Wrapped in an async function: the script awaits at its top level.
    expect(() => new Function(`return async () => {${script}}`)).not.toThrow();
  });

  it("calls the tool below its base, and reads the manifest where it is told", () => {
    const page = html("/t/crm", "/t/crm/play/manifest");
    expect(page).toContain('const BASE = "/t/crm";');
    expect(page).toContain('const MANIFEST_URL = "/t/crm/play/manifest";');
    expect(page).toContain('fetch(BASE + "/api/" + name');
    expect(page).toContain('fetch(BASE + "/mcp"');
    expect(page).toContain('fetch(BASE + "/cli"');
  });

  it("cannot be broken out of by its options", () => {
    const page = html("/t/</script><script>x</script>");
    expect(page.match(/<\/script>/g)).toHaveLength(1);
    const script = /<script>([\s\S]*)<\/script>/.exec(page)![1]!;
    expect(() => new Function(`return async () => {${script}}`)).not.toThrow();
  });
});
