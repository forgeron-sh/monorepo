import { Alert, AlertDescription, AlertTitle } from "@forgeron/ui";

export default function Default() {
  return (
    <div style={{ display: "grid", gap: 12, width: 420 }}>
      <Alert>
        <AlertTitle>Release scheduled</AlertTitle>
        <AlertDescription>It goes live tonight at 22:00.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle>Payment failed</AlertTitle>
        <AlertDescription>Check the card on file and try again.</AlertDescription>
      </Alert>
    </div>
  );
}
