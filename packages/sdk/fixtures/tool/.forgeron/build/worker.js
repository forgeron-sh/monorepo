// A hand-written stand-in for what `forgeron build` writes: the same shape, no compiler needed.
import { createRuntime } from "@forgeron/runtime";
import { z } from "zod";

const action = (access, method, extra = {}) => ({
  description: `Action with ${access} access.`,
  access,
  input: { type: "object" },
  confirm: false,
  cli: { args: [] },
  http: { method },
  interfaces: ["mcp"],
  ...extra,
});

export const manifest = {
  name: "notes",
  version: "1.0.0",
  // Only MCP: a test must still be able to call every action.
  interfaces: { mcp: true, api: false, cli: false, web: false },
  profiles: { reader: { grants: ["read"] }, editor: { grants: ["read", "write"] } },
  actions: {
    "notes.info": action("read", "GET"),
    "notes.add": action("write", "POST"),
    "notes.counter": action("read", "GET"),
    "notes.denied": action("read", "GET"),
    "notes.crash": action("read", "GET"),
    "notes.crm": action("read", "GET"),
    "notes.leak": action("read", "GET"),
  },
  views: {},
  jobs: { tick: { cron: "0 2 * * *", timezone: "Europe/Paris" } },
  events: {},
  resources: { network: { allow: ["api.example.com"], why: "Notes API" } },
  uses: {},
  preview: { data: "seed" },
};

class ToolError extends Error {
  name = "ToolError";
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

let counter = 0;

const actions = {
  "notes.info": {
    input: z.object({}),
    run: (ctx) => ({
      user: ctx.user,
      now: ctx.now().toISOString(),
      secret: ctx.secrets.API_KEY,
      login: ctx.userSecrets.LOGIN,
      env: ctx.env,
    }),
  },
  "notes.add": {
    input: z.object({ text: z.string().min(1) }),
    run: async (ctx) => {
      const res = await ctx.fetch("https://api.example.com/notes", {
        method: "POST",
        body: JSON.stringify({ text: ctx.input.text }),
      });
      const note = await res.json();
      await ctx.emit("note.added", { id: note.id });
      return note;
    },
  },
  "notes.counter": {
    input: z.object({ scope: z.enum(["user", "tool"]) }),
    run: (ctx) => ctx.cache.getOrSet("n", { scope: ctx.input.scope }, async () => ++counter),
  },
  "notes.denied": {
    input: z.object({}),
    run: () => {
      throw new ToolError("FORBIDDEN", "Not yours");
    },
  },
  "notes.crash": {
    input: z.object({}),
    run: () => {
      throw new RangeError("boom");
    },
  },
  "notes.leak": {
    input: z.object({}),
    run: (ctx) => ctx.fetch("https://evil.test/"),
  },
  "notes.crm": {
    input: z.object({}),
    run: (ctx) => ctx.tools.crm.call("deals.list", { owner: ctx.user.email }),
  },
};

const jobs = {
  tick: { handler: (ctx) => ctx.emit("ticked", { as: ctx.user.id, via: ctx.interface }) },
};

export function createTool(options = {}) {
  return createRuntime({ manifest, actions, jobs, authenticate: () => undefined, ...options });
}
