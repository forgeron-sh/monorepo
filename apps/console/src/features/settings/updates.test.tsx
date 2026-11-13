// @vitest-environment jsdom
import { PLATFORM_PERMISSIONS } from "@forgeron/permissions";
import type { UpdateRun, UpdateState } from "@forgeron/platform-contract";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InstallPage } from "../../settings";
import { button, cleanup, click, fakeApi, mount, refusal } from "../../test-utils";
import type { WorkspaceInfo } from "../../workspace";
import { UpdatesPanel } from "./updates";

afterEach(cleanup);

const ws = (permissions: readonly string[] = PLATFORM_PERMISSIONS): WorkspaceInfo =>
  ({
    workspace: "demo",
    endpoint: "https://demo.example.test",
    person: {
      id: "m1",
      email: "ada@acme.fr",
      name: "ada",
      teams: ["admin"],
      permissions: [...permissions],
    },
    setup: { members: 1, invitations: 0, tools: 0, deployed: 0, called: false },
    install: { baseDomain: "example.test", version: "0.5.0" },
  }) as WorkspaceInfo;

const PATH = "/api/platform/update";
const latest = {
  version: "0.6.0",
  publishedAt: "2026-11-13T09:30:00.000Z",
  url: "https://github.com/forgeron-sh/monorepo/releases/tag/v0.6.0",
  notes: "## What is new\n\n- One click updates.",
};
const available: UpdateState = {
  current: { version: "0.5.0", commit: "abc" },
  latest,
  available: true,
  pending: { migrations: ["0043_platform_updates", "0044_other"] },
};

const STEPS = ["download", "restore-point", "migrate", "code", "deploy"] as const;
/** A run as the platform answers it, with the first `done` steps finished. */
const runWith = (done: number, patch: Partial<UpdateRun> = {}): UpdateRun => ({
  id: "r1",
  from: "0.5.0",
  to: "0.6.0",
  state: done === 5 ? "succeeded" : "running",
  steps: STEPS.map((name, i) => ({
    name,
    state: i < done ? "done" : i === done ? "running" : "pending",
    ...(i < done ? { message: `${name} done` } : {}),
  })),
  startedAt: "2026-11-13T10:00:00.000Z",
  ...patch,
});

const settle = async (until: () => boolean) => {
  for (let i = 0; i < 100 && !until(); i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
  }
};
const text = (page: HTMLElement) => page.textContent ?? "";

describe("the Updates panel (D-138)", () => {
  it("says the platform is up to date, with nothing to click", async () => {
    const { api } = fakeApi({
      [PATH]: { current: { version: "0.6.0" }, latest, available: false },
    });
    const page = await mount(<UpdatesPanel api={api} ws={ws()} />);
    expect(text(page)).toContain("Up to date");
    expect(text(page)).toContain("v0.6.0");
    expect(button(page, "Update to v0.6.0")).toBeUndefined();
  });

  it("shows the newer release: date, link, notes, and the migrations with their warning", async () => {
    const { api } = fakeApi({ [PATH]: available });
    const page = await mount(<UpdatesPanel api={api} ws={ws()} />);
    expect(text(page)).toContain("v0.6.0 is available");
    expect(text(page)).toContain("released 2026-11-13");
    expect(text(page)).toContain("What is new");
    expect(text(page)).toContain("One click updates.");
    const link = [...page.querySelectorAll("a")].find((a) => a.textContent?.includes("GitHub"));
    expect(link?.getAttribute("href")).toBe(latest.url);
    expect(link?.getAttribute("rel")).toContain("noopener");
    expect(text(page)).toContain("2 migrations will be applied");
    expect(text(page)).toContain("0043_platform_updates");
    expect(text(page)).toContain("cannot be undone, except by restoring the restore point");
    expect(button(page, "Update to v0.6.0")).toBeDefined();
  });

  it("does not offer the button without Update Forgeron, and says what to ask for", async () => {
    const { api } = fakeApi({ [PATH]: available });
    const page = await mount(<UpdatesPanel api={api} ws={ws(["settings:read"])} />);
    expect(text(page)).toContain("v0.6.0 is available");
    expect(button(page, "Update to v0.6.0")).toBeUndefined();
    expect(text(page)).toContain('needs the permission "Update Forgeron"');
  });

  it("explains in plain words why nothing is offered", async () => {
    const blocked = {
      current: { version: "0.5.0" },
      available: false,
      blocked: {
        code: "NO_DATABASE_ID",
        message:
          "Run `forgeron platform install` once more: this install does not know its database id yet.",
      },
    };
    const { api } = fakeApi({ [PATH]: blocked });
    const page = await mount(<UpdatesPanel api={api} ws={ws()} />);
    expect(text(page)).toContain("This install does not know its database yet");
    expect(text(page)).toContain("Run `forgeron platform install` once more");
    expect(page.querySelector("button")).toBeNull();

    const off = fakeApi({
      [PATH]: {
        current: { version: "0.5.0" },
        latest,
        available: true,
        blocked: { code: "OFF", message: "Turned off (SELF_UPDATE=off)." },
      },
    });
    const turnedOff = await mount(<UpdatesPanel api={off.api} ws={ws()} />);
    expect(text(turnedOff)).toContain("Updating from the console is turned off");
    expect(button(turnedOff, "Update to v0.6.0")).toBeUndefined();
  });

  it("asks for a confirmation that says what happens, and sends nothing until it is given", async () => {
    const { api, sent } = fakeApi({ [PATH]: available });
    const page = await mount(<UpdatesPanel api={api} ws={ws()} />);
    await click(button(page, "Update to v0.6.0"));
    const dialog = document.querySelector("[role=dialog]")!;
    expect(dialog.textContent).toContain("restore point");
    expect(dialog.textContent).toContain("Every workspace on this platform is updated");
    expect(dialog.textContent).toContain("cannot be undone");
    await click(button(dialog as HTMLElement, "Cancel"));
    expect(sent).toEqual([]);
    expect(document.querySelector("[role=dialog]")).toBeNull();
  });

  it("starts the update, follows its steps live, and offers Reload when it is done", async () => {
    let polls = 0;
    const { api, sent } = fakeApi({
      [PATH]: available,
      [`POST ${PATH}`]: () => ({ run: runWith(0) }),
      "/api/platform/update/runs/r1": () => {
        polls += 1;
        return { run: runWith(polls < 2 ? 2 : polls < 4 ? 4 : 5) };
      },
    });
    const reload = vi.fn<() => void>();
    const page = await mount(<UpdatesPanel api={api} ws={ws()} pollMs={5} reload={reload} />);
    await click(button(page, "Update to v0.6.0"));
    await click(button(document.querySelector("[role=dialog]") as HTMLElement, "Update to v0.6.0"));
    expect(sent).toEqual([{ path: PATH, body: { version: "0.6.0" }, method: "POST" }]);
    expect(text(page)).toContain("Download the release and check it");
    expect(text(page)).toContain("Updating from v0.5.0 to v0.6.0");
    expect(button(page, "Reload")).toBeUndefined();

    await settle(() => button(page, "Reload") !== undefined);
    expect(text(page)).toContain("Forgeron is now v0.6.0");
    const steps = [...page.querySelectorAll(".fc-step")].map((s) => s.textContent ?? "");
    expect(steps).toHaveLength(5);
    expect(steps.every((s) => s.includes("Done"))).toBe(true);
    await click(button(page, "Reload"));
    expect(reload).toHaveBeenCalledTimes(1);
    // Done: no more asking.
    const before = polls;
    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });
    expect(polls).toBe(before);
  });

  it("keeps asking while the platform does not answer, then goes on", async () => {
    let polls = 0;
    const { api } = fakeApi({
      [PATH]: available,
      [`POST ${PATH}`]: () => ({ run: runWith(4) }),
      "/api/platform/update/runs/r1": () => {
        polls += 1;
        if (polls < 3) throw refusal(502);
        return { run: runWith(5) };
      },
    });
    const page = await mount(<UpdatesPanel api={api} ws={ws()} pollMs={5} reload={() => {}} />);
    await click(button(page, "Update to v0.6.0"));
    await click(button(document.querySelector("[role=dialog]") as HTMLElement, "Update to v0.6.0"));
    await settle(() => text(page).includes("Waiting for the platform"));
    expect(text(page)).toContain("Waiting for the platform");
    await settle(() => button(page, "Reload") !== undefined);
    expect(button(page, "Reload")).toBeDefined();
  });

  it("says which step failed, why, and how to restore, when the update fails after the migrations", async () => {
    const failed = runWith(4, {
      state: "failed",
      bookmark: "00000085-0000f3a5",
      error: "Cloudflare refused. The database may already have changed.",
      restoreCommand: "wrangler d1 time-travel restore db-1 --bookmark 00000085-0000f3a5",
    });
    failed.steps[4] = {
      name: "deploy",
      state: "failed",
      message: "Cloudflare refused the version.",
    };
    const { api } = fakeApi({
      [PATH]: available,
      [`POST ${PATH}`]: () => ({ run: runWith(3) }),
      "/api/platform/update/runs/r1": () => ({ run: failed }),
    });
    const page = await mount(<UpdatesPanel api={api} ws={ws()} pollMs={5} />);
    await click(button(page, "Update to v0.6.0"));
    await click(button(document.querySelector("[role=dialog]") as HTMLElement, "Update to v0.6.0"));
    await settle(() => text(page).includes("The update stopped at"));
    expect(text(page)).toContain("The update stopped at: deploy the new version");
    expect(text(page)).toContain("Cloudflare refused the version.");
    expect(text(page)).toContain(
      "wrangler d1 time-travel restore db-1 --bookmark 00000085-0000f3a5",
    );
    expect(button(page, "Reload")).toBeUndefined();
    // It can be tried again.
    expect(button(page, "Update to v0.6.0")).toBeDefined();
  });

  it("says nothing was changed when the update fails before the database", async () => {
    const failed = runWith(0, { state: "failed", error: "checksum" });
    failed.steps[0] = {
      name: "download",
      state: "failed",
      message: "The checksum does not match.",
    };
    const { api } = fakeApi({ [PATH]: { ...available, lastFailed: failed } });
    const page = await mount(<UpdatesPanel api={api} ws={ws()} />);
    expect(text(page)).toContain("The checksum does not match.");
    expect(text(page)).toContain("Nothing was changed on the platform.");
    expect(text(page)).not.toContain("wrangler");
  });

  it("follows an update that is already running when the page opens", async () => {
    let polls = 0;
    const { api } = fakeApi({
      [PATH]: { ...available, running: runWith(1) },
      "/api/platform/update/runs/r1": () => ({ run: runWith(++polls < 2 ? 2 : 5) }),
    });
    const page = await mount(
      <UpdatesPanel api={api} ws={ws(["settings:read"])} pollMs={5} reload={() => {}} />,
    );
    expect(text(page)).toContain("Updating from v0.5.0 to v0.6.0");
    await settle(() => button(page, "Reload") !== undefined);
    expect(button(page, "Reload")).toBeDefined();
  });

  it("shows why a start was refused, and no run", async () => {
    const { api } = fakeApi({
      [PATH]: available,
      [`POST ${PATH}`]: () => {
        throw refusal(409, "An update is already running.", "RUNNING");
      },
    });
    const page = await mount(<UpdatesPanel api={api} ws={ws()} />);
    await click(button(page, "Update to v0.6.0"));
    await click(button(document.querySelector("[role=dialog]") as HTMLElement, "Update to v0.6.0"));
    expect(text(page)).toContain("The update did not start");
    expect(text(page)).toContain("An update is already running.");
    expect(page.querySelector(".fc-steps")).toBeNull();
  });

  it("says when the updates could not be loaded", async () => {
    const { api } = fakeApi({});
    const page = await mount(<UpdatesPanel api={api} ws={ws()} />);
    expect(text(page)).toContain("Updates could not be loaded.");
  });
});

describe("Install information", () => {
  it("holds the Updates panel under the version it updates", async () => {
    const { api } = fakeApi({ [PATH]: available });
    const page = await mount(<InstallPage api={api} ws={ws()} />);
    expect(text(page)).toContain("Gateway version");
    expect(page.querySelector('[aria-label="Updates"]')).not.toBeNull();
  });

  it("asks nothing of the platform without settings:read", async () => {
    const { api, reads } = fakeApi({ [PATH]: available });
    const page = await mount(<InstallPage api={api} ws={ws([])} />);
    expect(text(page)).toContain("needs the permission");
    expect(reads).toEqual([]);
  });
});
