// A tool's availability and the people's libraries (D-117). An admin decides who may add a tool; a
// person adds it to their library, gives what its setup asks, and removes it when they are done.
// Removing it takes away the person's setup values and the bindings of their saved secrets for that
// tool, in the same batch: the secrets themselves stay on the person's page of secrets (D-106).
import { RegistryError } from "../../kernel/errors";
import type { Kernel } from "../../kernel/kernel";
import type { Row } from "../../kernel/rows";
import { AVAILABILITY_MODES, type Availability, type AvailabilityMode } from "./types";

const toAvailability = (r: Row): Availability => {
  const mode = String(r.mode) as AvailabilityMode;
  let subjects: string[] = [];
  try {
    const parsed = JSON.parse(String(r.subjects)) as unknown;
    if (Array.isArray(parsed)) subjects = parsed.filter((s): s is string => typeof s === "string");
  } catch {
    // A row written by this module is always JSON; anything else names nobody.
  }
  return {
    mode,
    roles: mode === "roles" ? subjects : [],
    people: mode === "people" ? subjects : [],
    ...(r.updated_by ? { updatedBy: String(r.updated_by) } : {}),
    updatedAt: String(r.updated_at),
  };
};

export function createLibrary(kernel: Kernel) {
  const { d1, now, all, first, auditStatement } = kernel;

  return {
    /** The tool's rule, or `undefined` for a tool that has none (open as before D-117). */
    async availabilityOf(toolId: string): Promise<Availability | undefined> {
      const row = await first(`SELECT * FROM "tool_availability" WHERE "tool_id" = ?`, toolId);
      return row ? toAvailability(row) : undefined;
    },

    /** Sets who may add the tool. Audited with the rule, never with anything secret. */
    async setAvailability(input: {
      toolId: string;
      mode: AvailabilityMode;
      roles?: string[];
      people?: string[];
      actor: string;
      via?: string;
    }): Promise<Availability> {
      if (!AVAILABILITY_MODES.includes(input.mode)) {
        throw new RegistryError("INVALID", `${String(input.mode)} is not an availability.`);
      }
      const subjects =
        input.mode === "roles"
          ? [...new Set(input.roles ?? [])]
          : input.mode === "people"
            ? [...new Set(input.people ?? [])]
            : [];
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "tool_availability" ("tool_id", "mode", "subjects", "updated_by", "updated_at") VALUES (?, ?, ?, ?, ?) ON CONFLICT ("tool_id") DO UPDATE SET "mode" = excluded."mode", "subjects" = excluded."subjects", "updated_by" = excluded."updated_by", "updated_at" = excluded."updated_at"`,
          )
          .bind(input.toolId, input.mode, JSON.stringify(subjects), input.actor, at),
        auditStatement(
          {
            toolId: input.toolId,
            actor: input.actor,
            ...(input.via ? { via: input.via } : {}),
            kind: "access",
            subject: "availability",
            detail: { event: "availability-set", mode: input.mode, subjects },
          },
          at,
        ),
      ]);
      return (await this.availabilityOf(input.toolId))!;
    },

    /** The ids of the tools in a person's library. */
    async libraryOf(person: string): Promise<Set<string>> {
      return new Set(
        (await all(`SELECT "tool_id" FROM "person_tools" WHERE "person" = ?`, person)).map((r) =>
          String(r.tool_id),
        ),
      );
    },

    async isInstalled(toolId: string, person: string): Promise<boolean> {
      return (
        (await first(
          `SELECT 1 FROM "person_tools" WHERE "tool_id" = ? AND "person" = ?`,
          toolId,
          person,
        )) !== undefined
      );
    },

    /** Adds a tool to a person's library; adding it twice is the same. Audited once. */
    async installForPerson(input: { toolId: string; person: string; via?: string }): Promise<void> {
      if (await this.isInstalled(input.toolId, input.person)) return;
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `INSERT OR IGNORE INTO "person_tools" ("tool_id", "person", "installed_at") VALUES (?, ?, ?)`,
          )
          .bind(input.toolId, input.person, at),
        auditStatement(
          {
            toolId: input.toolId,
            actor: input.person,
            ...(input.via ? { via: input.via } : {}),
            kind: "access",
            subject: "library",
            detail: { event: "library-added" },
          },
          at,
        ),
      ]);
    },

    /**
     * Takes a tool out of a person's library, with their setup values and the bindings of their
     * saved secrets for it. Returns whether it was there.
     */
    async uninstallForPerson(input: {
      toolId: string;
      person: string;
      via?: string;
    }): Promise<boolean> {
      if (!(await this.isInstalled(input.toolId, input.person))) return false;
      const at = now();
      await d1.batch([
        d1
          .prepare(`DELETE FROM "person_tools" WHERE "tool_id" = ? AND "person" = ?`)
          .bind(input.toolId, input.person),
        d1
          .prepare(`DELETE FROM "user_setup" WHERE "tool_id" = ? AND "person" = ?`)
          .bind(input.toolId, input.person),
        d1
          .prepare(`DELETE FROM "secret_bindings" WHERE "tool_id" = ? AND "person" = ?`)
          .bind(input.toolId, input.person),
        auditStatement(
          {
            toolId: input.toolId,
            actor: input.person,
            ...(input.via ? { via: input.via } : {}),
            kind: "access",
            subject: "library",
            detail: { event: "library-removed" },
          },
          at,
        ),
      ]);
      return true;
    },

    // ---- channel access (D-119, D-125): who may use a channel other than production, and who added it.
    // A channel is named by its reference: a branch (a temporary channel) or `~<name>` (a permanent one).
    async channelAccessOf(toolId: string, channel: string): Promise<Availability | undefined> {
      const row = await first(
        `SELECT * FROM "channel_access" WHERE "tool_id" = ? AND "channel" = ?`,
        toolId,
        channel,
      );
      return row ? toAvailability(row) : undefined;
    },

    /** Who may use a channel. Audited on the tool, with the channel. */
    async setChannelAccess(input: {
      toolId: string;
      channel: string;
      mode: AvailabilityMode;
      roles?: string[];
      people?: string[];
      actor: string;
      via?: string;
    }): Promise<Availability> {
      if (!AVAILABILITY_MODES.includes(input.mode)) {
        throw new RegistryError("INVALID", `${String(input.mode)} is not an availability.`);
      }
      const subjects =
        input.mode === "roles"
          ? [...new Set(input.roles ?? [])]
          : input.mode === "people"
            ? [...new Set(input.people ?? [])]
            : [];
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "channel_access" ("tool_id", "channel", "mode", "subjects", "updated_by", "updated_at") VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT ("tool_id", "channel") DO UPDATE SET "mode" = excluded."mode", "subjects" = excluded."subjects", "updated_by" = excluded."updated_by", "updated_at" = excluded."updated_at"`,
          )
          .bind(input.toolId, input.channel, input.mode, JSON.stringify(subjects), input.actor, at),
        auditStatement(
          {
            toolId: input.toolId,
            actor: input.actor,
            ...(input.via ? { via: input.via } : {}),
            kind: "access",
            subject: `availability@${input.channel}`,
            detail: {
              event: "channel-access-set",
              channel: input.channel,
              mode: input.mode,
              subjects,
            },
          },
          at,
        ),
      ]);
      return (await this.channelAccessOf(input.toolId, input.channel))!;
    },

    /** The channels other than production a person added: tool and channel reference. */
    async channelsOf(person: string): Promise<Array<{ toolId: string; channel: string }>> {
      return (
        await all(`SELECT "tool_id", "channel" FROM "person_channels" WHERE "person" = ?`, person)
      ).map((r) => ({ toolId: String(r.tool_id), channel: String(r.channel) }));
    },

    async isChannelInstalled(toolId: string, channel: string, person: string): Promise<boolean> {
      return (
        (await first(
          `SELECT 1 FROM "person_channels" WHERE "tool_id" = ? AND "channel" = ? AND "person" = ?`,
          toolId,
          channel,
          person,
        )) !== undefined
      );
    },

    async installChannelForPerson(input: {
      toolId: string;
      channel: string;
      person: string;
      via?: string;
    }): Promise<void> {
      if (await this.isChannelInstalled(input.toolId, input.channel, input.person)) return;
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `INSERT OR IGNORE INTO "person_channels" ("tool_id", "channel", "person", "installed_at") VALUES (?, ?, ?, ?)`,
          )
          .bind(input.toolId, input.channel, input.person, at),
        auditStatement(
          {
            toolId: input.toolId,
            actor: input.person,
            ...(input.via ? { via: input.via } : {}),
            kind: "access",
            subject: `library@${input.channel}`,
            detail: { event: "channel-added", channel: input.channel },
          },
          at,
        ),
      ]);
    },

    /**
     * Takes a channel out of a person's library, with the bindings of their saved secrets to it
     * (`preview:<channel>`). The setup values belong to the tool and stay. Returns whether it was there.
     */
    async uninstallChannelForPerson(input: {
      toolId: string;
      channel: string;
      person: string;
      via?: string;
    }): Promise<boolean> {
      if (!(await this.isChannelInstalled(input.toolId, input.channel, input.person))) return false;
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `DELETE FROM "person_channels" WHERE "tool_id" = ? AND "channel" = ? AND "person" = ?`,
          )
          .bind(input.toolId, input.channel, input.person),
        d1
          .prepare(
            `DELETE FROM "secret_bindings" WHERE "tool_id" = ? AND "person" = ? AND "scope" = ?`,
          )
          .bind(input.toolId, input.person, `preview:${input.channel}`),
        auditStatement(
          {
            toolId: input.toolId,
            actor: input.person,
            ...(input.via ? { via: input.via } : {}),
            kind: "access",
            subject: `library@${input.channel}`,
            detail: { event: "channel-removed", channel: input.channel },
          },
          at,
        ),
      ]);
      return true;
    },
  };
}
