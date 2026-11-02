import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { watchSources } from "./watch";

let dir: string;
let stop: (() => void) | undefined;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "forgeron-watch-"));
  await mkdir(join(dir, "actions"), { recursive: true });
  await mkdir(join(dir, "node_modules", "x"), { recursive: true });
  await mkdir(join(dir, ".forgeron", "build"), { recursive: true });
});
afterEach(async () => {
  stop?.();
  await rm(dir, { recursive: true, force: true });
});

describe("watchSources", () => {
  it("calls back once after a burst of changes", async () => {
    const onChange = vi.fn<() => void>();
    // A window wide enough that a slow machine does not split the burst in two.
    stop = watchSources(dir, onChange, 300);
    await writeFile(join(dir, "actions", "a.ts"), "1");
    await writeFile(join(dir, "actions", "a.ts"), "2");
    await writeFile(join(dir, "actions", "b.ts"), "3");
    await vi.waitFor(() => expect(onChange).toHaveBeenCalled(), { timeout: 3000 });
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("ignores node_modules and the build output, which a build itself writes", async () => {
    const onChange = vi.fn<() => void>();
    stop = watchSources(dir, onChange, 50);
    // Late reports of the folders made in the setup are not what is tested: wait, then count from here.
    await new Promise((resolve) => setTimeout(resolve, 700));
    onChange.mockClear();
    await writeFile(join(dir, "node_modules", "x", "i.js"), "1");
    await writeFile(join(dir, ".forgeron", "build", "worker.js"), "1");
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("stops calling back once stopped", async () => {
    const onChange = vi.fn<() => void>();
    stop = watchSources(dir, onChange, 50);
    await new Promise((resolve) => setTimeout(resolve, 700));
    onChange.mockClear();
    stop();
    await writeFile(join(dir, "actions", "a.ts"), "1");
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(onChange).not.toHaveBeenCalled();
  });
});
