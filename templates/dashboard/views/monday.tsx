import { Page, Select, Stat, BarChart, Table } from "@forgeron/ui";
import { z } from "@forgeron/sdk";
import { defineView, useAction, useParams } from "@forgeron/sdk/react";

interface Summary {
  since: string;
  won: number;
  totals: Array<{ stage: string; count: number; amount: number }>;
}
interface Stale {
  items: Array<{
    id: string;
    title: string;
    company: string;
    owner_email: string;
    updated_at: string;
  }>;
}

const money = new Intl.NumberFormat("en", { style: "currency", currency: "EUR" });

const params = z.object({ owner: z.string().email().optional() }); // ?owner=… in the URL

export default defineView({
  title: "Monday meeting",
  path: "/monday",
  access: "read",
  params,

  component() {
    const [{ owner }, setParams] = useParams<z.output<typeof params>>();
    const summary = useAction<Summary>("sales.summary", { owner });
    const stale = useAction<Stale>("sales.stale", { owner, days: 30 });
    const owners = useAction<string[]>("sales.owners");

    return (
      <Page
        title="Monday meeting"
        actions={
          <Select
            aria-label="Salesperson"
            value={owner ?? ""}
            options={[
              { value: "", label: "Everyone" },
              ...(owners.data ?? []).map((email) => ({ value: email, label: email })),
            ]}
            onChange={(event) => setParams({ owner: event.target.value || undefined })}
          />
        }
      >
        <Stat
          label="Won this month"
          value={summary.data ? money.format(summary.data.won / 100) : "…"}
          hint={summary.data ? `since ${summary.data.since}` : undefined}
        />
        <BarChart
          title="Leads by stage"
          data={(summary.data?.totals ?? []).map((t) => ({
            label: t.stage,
            value: t.amount / 100,
          }))}
        />
        <Table
          columns={[
            { key: "title", header: "Lead" },
            { key: "company", header: "Company" },
            { key: "owner_email", header: "Owner" },
            { key: "updated_at", header: "Last activity", mono: true },
          ]}
          rows={stale.data?.items ?? []}
          rowKey={(row) => row.id}
          empty="No lead without activity for 30 days."
        />
      </Page>
    );
  },
});
