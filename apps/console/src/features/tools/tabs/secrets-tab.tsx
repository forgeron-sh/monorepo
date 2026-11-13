import { CopyBlock } from "@forgeron/ui";
import { can } from "../../../shell/access";
import { loadSecretsStatus, SecretsStatus } from "../../../secrets-status";
import { Loading, LoadError } from "../../../states";
import { useLoad } from "../../../use-load";
import PeopleSecrets from "./people-secrets";
import type { ToolTabProps } from "../tabs";

export default function SecretsTab(props: ToolTabProps) {
  const { tool, api, branch } = props;
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
      {branch === undefined ? (
        <>
          <SecretsStatus rows={secrets.data ?? []} />
          <CopyBlock label="Set a secret" value="forgeron secrets set <NAME>" prefix="$" />
          {can(props.ws.person, "tools:approve") ? <PeopleSecrets {...props} /> : null}
        </>
      ) : (
        <>
          {/* Every branch's preview reads the preview's secrets; a person's are the branch's own. */}
          <SecretsStatus rows={secrets.data ?? []} environments={["preview"]} />
          <CopyBlock
            label="Set a secret for the previews"
            value="forgeron secrets set <NAME> --env preview"
            prefix="$"
          />
          <p className="fc-muted">
            Each pilot gives what this branch asks of them from their library. What they give is
            kept apart from what they gave the tool in production.
          </p>
        </>
      )}
    </div>
  );
}
