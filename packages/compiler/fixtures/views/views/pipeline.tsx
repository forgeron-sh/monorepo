import { defineView, useAction, useMutation } from "@forgeron/sdk/react";
import { z } from "@forgeron/sdk";

export default defineView({
  title: "Pipeline",
  path: "/pipeline",
  access: "read",
  params: z.object({ owner: z.string().optional() }),
  component() {
    const deals = useAction("deals.list", {});
    const move = useMutation("deals.move");
    return (
      <button type="button" onClick={() => move.run({ id: 1, stage: "won" })}>
        {deals.loading ? "…" : "Move"}
      </button>
    );
  },
});
