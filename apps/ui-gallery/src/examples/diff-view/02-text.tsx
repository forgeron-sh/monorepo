import { DiffView } from "@forgeron/ui";

const before = `# Leave policy

Every employee has 25 days of paid leave per year.
Requests are sent to the manager at least two weeks ahead.

## Carry over
Unused days are lost on 31 December.

## Sick leave
Send the certificate within 48 hours.
Managers are told the same day.
Long absences are reviewed monthly.
HR keeps the certificate for five years.`;

const after = `# Leave policy

Every employee has 27 days of paid leave per year.
Requests are sent to the manager at least one week ahead.

## Carry over
Up to five unused days carry over until 31 March.

## Sick leave
Send the certificate within 48 hours.
Managers are told the same day.
Long absences are reviewed monthly.
HR keeps the certificate for five years.

## Parental leave
See the dedicated page.`;

export default function Text() {
  return (
    <div style={{ width: "100%", maxWidth: 760 }}>
      <DiffView before={before} after={after} beforeLabel="v3" afterLabel="v4" context={2} />
    </div>
  );
}
