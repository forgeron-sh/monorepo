import { Button } from "@forgeron/ui";

export default function Disabled() {
  return (
    <>
      <Button variant="primary" disabled>
        Deploying
      </Button>
      <Button disabled>Preview</Button>
    </>
  );
}
