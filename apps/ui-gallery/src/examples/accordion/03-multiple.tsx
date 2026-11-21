import { Accordion } from "@forgeron/ui";

export default function Multiple() {
  return (
    <div style={{ width: "min(100%, 480px)" }}>
      <Accordion
        multiple
        defaultValue={["a", "b"]}
        items={[
          { value: "a", title: "Profile", content: "Name, photo, language." },
          { value: "b", title: "Notifications", content: "Email and in-app." },
          { value: "c", title: "Security", content: "Password and sessions." },
        ]}
      />
    </div>
  );
}
