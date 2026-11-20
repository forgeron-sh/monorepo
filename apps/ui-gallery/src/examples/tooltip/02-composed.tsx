import { Edit02Icon } from "@forgeron/icons";
import { IconButton, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@forgeron/ui";

// shadcn's composition: Tooltip without content is the root of the parts.
export default function Composed() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <IconButton icon={Edit02Icon} label="Edit" />
        </TooltipTrigger>
        <TooltipContent side="bottom">Edit</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
