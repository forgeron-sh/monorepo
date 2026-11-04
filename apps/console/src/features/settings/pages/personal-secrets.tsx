import { EmptyState, Page } from "@forgeron/ui";

export default function PersonalSecretsPage() {
  return (
    <Page
      title="Personal secrets"
      description="The secrets only you hold for a tool, such as your own API key."
    >
      <EmptyState
        title="Nothing to show yet"
        description="A tool asks for a personal secret when it needs one. Values are never shown; a list of yours is not available yet."
      />
    </Page>
  );
}
