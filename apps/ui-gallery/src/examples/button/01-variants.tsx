import { Button } from "@forgeron/ui";

export default function Variants() {
  return (
    <>
      <Button variant="primary">Deploy</Button>
      <Button>Preview</Button>
      <Button variant="ink">Publish</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="danger">Delete</Button>
    </>
  );
}
