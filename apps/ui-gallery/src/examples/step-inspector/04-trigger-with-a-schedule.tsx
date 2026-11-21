import { StepFields } from "@forgeron/ui";

// StepFields alone, in any panel: here the fields of a Schedule trigger.
export default function TriggerWithASchedule() {
  return (
    <div style={{ width: "100%", maxWidth: 480 }}>
      <StepFields
        timezone="Europe/Paris"
        fields={[
          { key: "cron", label: "Runs", type: "schedule", typeLabel: "Cron" },
          {
            key: "tz",
            label: "Timezone",
            type: "select",
            options: ["Europe/Paris", "UTC", "Europe/London"].map((t) => ({ value: t, label: t })),
          },
          {
            key: "payload",
            label: "Payload",
            type: "json",
            typeLabel: "Json",
            hint: "Given to the first step.",
          },
        ]}
        defaultValues={{
          cron: "0 8 * * 1-5",
          tz: "Europe/Paris",
          payload: '{ "report": "daily" }',
        }}
      />
    </div>
  );
}
