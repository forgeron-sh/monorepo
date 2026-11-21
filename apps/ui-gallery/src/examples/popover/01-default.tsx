import {
  Button,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@forgeron/ui";

// shadcn's composition: Popover without trigger is the root of the parts.
export default function Composed() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm">Share</Button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <PopoverTitle>Share the report</PopoverTitle>
        <PopoverDescription>Anyone in the workspace can open it.</PopoverDescription>
      </PopoverContent>
    </Popover>
  );
}
