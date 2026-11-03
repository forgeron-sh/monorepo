import { action, z } from "@forgeron/sdk";
import { attributes, isDate } from "../../lib/attributes";
import { parseCsv } from "../../lib/csv";

const KNOWN = new Set(["ref", "type", "site", "next_check"]);

export default action({
  description:
    "Imports or updates equipment from CSV text (header line, then columns ref, type, site, next_check; any other column becomes an attribute). Rows are matched on ref. `dryRun` defaults to true: it only reports what would change.",
  access: "import",
  input: z.object({
    csv: z.string().min(1).describe("The content of the CSV file"),
    dryRun: z.boolean().default(true),
  }),
  cli: { args: ["csv"] },
  async run({ input, db, user, emit }) {
    const rows = parseCsv(input.csv);
    const sites = await db.selectFrom("sites").select(["id", "name"]).execute();
    const siteId = new Map(sites.map((s) => [s.name.toLowerCase(), s.id]));
    const known = new Set(
      (await db.selectFrom("equipments").select("ref").execute()).map((e) => e.ref),
    );

    const errors: string[] = [];
    const seen = new Set<string>();
    const values: Array<{
      ref: string;
      type: string;
      site_id: string;
      next_check: string | null;
      attributes: string;
    }> = [];
    rows.forEach((r, i) => {
      const line = i + 2;
      const site = siteId.get((r.site ?? "").toLowerCase());
      if (!r.ref) errors.push(`Row ${line}: ref is empty`);
      else if (seen.has(r.ref)) errors.push(`Row ${line}: ref "${r.ref}" appears twice`);
      else if (!r.type) errors.push(`Row ${line}: type is empty`);
      else if (!site) errors.push(`Row ${line}: unknown site "${r.site ?? ""}"`);
      else if (r.next_check && !isDate(r.next_check))
        errors.push(`Row ${line}: next_check "${r.next_check}" is not a date YYYY-MM-DD`);
      else {
        seen.add(r.ref);
        const extra = Object.fromEntries(
          Object.entries(r).filter(([name, value]) => !KNOWN.has(name) && name && value !== ""),
        );
        if (extra.power_kw !== undefined) {
          const power = Number(extra.power_kw);
          if (Number.isNaN(power)) {
            errors.push(`Row ${line}: power_kw "${extra.power_kw}" is not a number`);
            return;
          }
          (extra as Record<string, unknown>).power_kw = power;
        }
        values.push({
          ref: r.ref,
          type: r.type,
          site_id: site,
          next_check: r.next_check || null,
          attributes: JSON.stringify(attributes.parse(extra)),
        });
      }
    });

    const applied = !input.dryRun && errors.length === 0;
    if (applied) {
      for (const value of values) {
        await db
          .insertInto("equipments")
          .values(value)
          .onConflict((oc) =>
            oc.column("ref").doUpdateSet({
              type: value.type,
              site_id: value.site_id,
              next_check: value.next_check,
              attributes: value.attributes,
            }),
          )
          .execute();
      }
      await emit("inventory.synced", {
        source: "csv",
        items: rows.length,
        updated: values.length,
        by: user.email,
      });
    }
    return {
      rows: rows.length,
      valid: values.length,
      created: values.filter((v) => !known.has(v.ref)).length,
      updated: values.filter((v) => known.has(v.ref)).length,
      errors,
      applied,
    };
  },
});
