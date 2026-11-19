import { Banner, Button } from "@forgeron/ui";

export default function Tones() {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <Banner title="Scheduled maintenance" dismissible>
        Saturday 21 November, 02:00 to 03:00 CET.
      </Banner>
      <Banner
        tone="warning"
        title="Your trial ends in 3 days."
        action={<Button size="sm">Choose a plan</Button>}
      />
      <Banner
        tone="danger"
        title="Payment failed."
        action={
          <Button size="sm" variant="danger">
            Update card
          </Button>
        }
      >
        We will retry tomorrow.
      </Banner>
      <Banner tone="success" title="Workspace restored." dismissible />
    </div>
  );
}
