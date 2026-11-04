import { EmptyState, Page } from "@forgeron/ui";

export default function ConnectedAccountsPage() {
  return (
    <Page
      title="Connected accounts"
      description="The accounts you let tools use on your behalf, such as Google or Microsoft."
    >
      <EmptyState
        title="Nothing to show yet"
        description="A tool asks for a connection the first time it needs one. A list of yours across tools is not available yet."
      />
    </Page>
  );
}
