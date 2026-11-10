import { CopyBlock } from "@forgeron/ui";
import { loadSecretsStatus, SecretsStatus } from "../../../secrets-status";
import { Loading, LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import PeopleSecrets from "./people-secrets";
import type { ToolTabProps } from "../tabs";

export default function SecretsTab(props: ToolTabProps) {
  const { tool, api } = props;
  const secrets = useLoad(() => loadSecretsStatus(api.fetchJson, tool), [api, tool]);
  if (secrets.loading) return <Loading shape="table" label="Loading secrets" />;
  if (secrets.error) {
    return <LoadError what="The secrets status" error={secrets.error} onRetry={secrets.reload} />;
  }
  return (
    <div className="fc-stack">
      <p className="fc-section-hint" style={{ margin: 0 }}>
        Values are never shown. Set one from the terminal.
      </p>
      <SecretsStatus rows={secrets.data ?? []} />
      <CopyBlock label="Set a secret" value="forgeron secrets set <NAME>" prefix="$" />
      <PeopleSecrets {...props} />
    </div>
  );
}
