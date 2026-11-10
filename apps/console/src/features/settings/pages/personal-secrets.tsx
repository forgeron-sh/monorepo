import { Button, Page } from "@forgeron/ui";

// The page of a person's own secrets is the gateway's, not the console's (D-106): a value is typed and
// changed there, with the session cookie only. This page is the way to it.
export default function PersonalSecretsPage() {
  return (
    <Page
      title="Personal secrets"
      description="The secrets only you hold for a tool, such as your own API key."
    >
      <p className="fc-section-hint" style={{ margin: 0 }}>
        See which tools use which secret, give a new value, keep a tool on an earlier version or use
        another secret for a test environment. A value is never shown.
      </p>
      <p>
        <a href="/my/secrets" className="fc-link">
          <Button variant="primary">Open your secrets</Button>
        </a>
      </p>
    </Page>
  );
}
