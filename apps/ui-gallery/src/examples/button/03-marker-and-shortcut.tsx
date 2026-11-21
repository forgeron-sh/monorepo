import { Button } from "@forgeron/ui";

export default function MarkerAndShortcut() {
  return (
    <>
      <Button variant="primary" marker>
        Get started
      </Button>
      <Button kbd="⌘K">Search</Button>
      <Button href="#docs" variant="ink">
        Read the docs
      </Button>
    </>
  );
}
