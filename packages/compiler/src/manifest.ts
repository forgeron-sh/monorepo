import { ManifestSchema, type Manifest } from "@forgeron/manifest";
import type { LoadedTool } from "./load";

// Writes the manifest from what the tool declares, with every default resolved (sdk.md §6, §14).

const INTERFACES = ["mcp", "api", "cli", "web"] as const;

function jsonSchema(loaded: LoadedTool, schema: unknown, io: "input" | "output", where: string) {
  try {
    const { $schema: _, ...rest } = loaded.toJsonSchema(schema, io);
    return rest;
  } catch (error) {
    throw new Error(`${where}: ${io} cannot be described as a JSON Schema. ${String(error)}`);
  }
}

/** Where the build writes a view, relative to `.forgeron/build/`. */
const viewEntryOf = (name: string) => `views/${name}.js`;

export function buildManifest(loaded: LoadedTool, version: string): Manifest {
  const { config } = loaded;
  // An `interfaces` object lists what is exposed; left out, everything but the web is.
  const interfaces = {
    mcp: config.interfaces ? (config.interfaces.mcp ?? false) : true,
    api: config.interfaces ? (config.interfaces.api ?? false) : true,
    cli: config.interfaces ? (config.interfaces.cli ?? false) : true,
    web: config.interfaces?.web ?? false,
  };
  const enabled = INTERFACES.filter((key) => interfaces[key]);

  const actions: Manifest["actions"] = {};
  for (const [name, def] of Object.entries(loaded.actions)) {
    const where = `actions/${name.replaceAll(".", "/")}`;
    if (def?.kind !== "action") {
      throw new Error(
        `${where}: the default export is not an action (use action() from @forgeron/sdk).`,
      );
    }
    actions[name] = {
      description: def.description,
      access: def.access,
      input: jsonSchema(loaded, def.input, "input", where) as Manifest["actions"][string]["input"],
      ...(def.output ? { output: jsonSchema(loaded, def.output, "output", where) } : {}),
      confirm: def.confirm ?? def.access === "delete",
      cli: { args: [...(def.cli?.args ?? [])] },
      http: def.http ?? { method: def.access === "read" ? "GET" : "POST" },
      interfaces: def.interfaces ? enabled.filter((key) => def.interfaces!.includes(key)) : enabled,
      ...(def.rateLimit ? { rateLimit: def.rateLimit } : {}),
    };
  }

  const jobs: Manifest["jobs"] = {};
  for (const [name, def] of Object.entries(loaded.jobs)) {
    if (def?.kind !== "job") {
      throw new Error(
        `jobs/${name}: the default export is not a task (use schedule() from @forgeron/sdk).`,
      );
    }
    jobs[name] = def.timezone ? { cron: def.cron, timezone: def.timezone } : { cron: def.cron };
  }

  if (loaded.schema !== undefined && !config.resources?.db) {
    throw new Error(
      "db/schema.ts declares tables, but resources.db is not declared in forgeron.config.ts (add `db: database()`).",
    );
  }

  if (loaded.seed !== undefined) {
    if (loaded.seed.kind !== "seed") {
      throw new Error(
        "db/seed.ts: the default export is not a seed (use seed() from @forgeron/sdk/db).",
      );
    }
    if (!config.resources?.db) {
      throw new Error(
        "db/seed.ts fills a database, but resources.db is not declared in forgeron.config.ts (add `db: database()`).",
      );
    }
  }

  const events: Manifest["events"] = {};
  for (const [name, def] of Object.entries(loaded.events)) {
    if (def?.kind !== "event") {
      throw new Error(
        `events/${name}: the default export is not an event handler (use on() from @forgeron/sdk).`,
      );
    }
    if (def.mode === "queue" && !config.resources?.queue) {
      throw new Error(
        `events/${name}: the handler of "${def.event}" runs in mode "queue", which needs resources.queue in forgeron.config.ts.`,
      );
    }
    events[name] = { event: def.event, mode: def.mode };
  }

  const views: Manifest["views"] = {};
  for (const [name, def] of Object.entries(loaded.views)) {
    const where = `views/${name}`;
    if (def?.kind !== "view") {
      throw new Error(
        `${where}: the default export is not a view (use defineView() from @forgeron/sdk/react).`,
      );
    }
    views[name] = {
      title: def.title,
      path: def.path,
      access: def.access,
      ...(def.params
        ? {
            params: jsonSchema(
              loaded,
              def.params,
              "input",
              where,
            ) as Manifest["actions"][string]["input"],
          }
        : {}),
      entry: viewEntryOf(name),
    };
  }

  const manifest = {
    name: config.name,
    version,
    ...(config.title ? { title: config.title } : {}),
    ...(config.description ? { description: config.description } : {}),
    interfaces,
    roles: config.roles ?? {},
    actions,
    views,
    jobs,
    events,
    resources: config.resources ?? {},
    uses: config.uses ?? {},
    preview: config.preview ?? { data: "seed" },
  };

  const parsed = ManifestSchema.safeParse(manifest);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
    throw new Error(`The manifest of "${config.name}" is not valid:\n${issues.join("\n")}`);
  }
  return parsed.data;
}
