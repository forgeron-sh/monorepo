import { Folder01Icon, File01Icon } from "@forgeron/icons";
import { Icon, TreeGroup, TreeItem, TreeItemContent, Tree } from "@forgeron/ui";

export default function Default() {
  return (
    <Tree
      aria-label="Project files"
      defaultExpanded={["src"]}
      defaultSelected={["button"]}
      style={{ width: 280 }}
    >
      <TreeItem id="src" textValue="src">
        <TreeItemContent>
          <Icon icon={Folder01Icon} size={12} variant="mono" className="fg-tree-icon" />
          <span className="fg-tree-name">src</span>
        </TreeItemContent>
        <TreeGroup>
          <TreeItem id="button" textValue="button.tsx">
            <TreeItemContent>
              <Icon icon={File01Icon} size={12} variant="mono" className="fg-tree-icon" />
              <span className="fg-tree-name">button.tsx</span>
            </TreeItemContent>
          </TreeItem>
          <TreeItem id="hooks" textValue="hooks">
            <TreeItemContent>
              <Icon icon={Folder01Icon} size={12} variant="mono" className="fg-tree-icon" />
              <span className="fg-tree-name">hooks</span>
            </TreeItemContent>
            <TreeGroup>
              <TreeItem id="use-controllable" textValue="use-controllable.ts">
                <TreeItemContent>
                  <Icon icon={File01Icon} size={12} variant="mono" className="fg-tree-icon" />
                  <span className="fg-tree-name">use-controllable.ts</span>
                </TreeItemContent>
              </TreeItem>
            </TreeGroup>
          </TreeItem>
        </TreeGroup>
      </TreeItem>
      <TreeItem id="readme" textValue="README.md">
        <TreeItemContent>
          <Icon icon={File01Icon} size={12} variant="mono" className="fg-tree-icon" />
          <span className="fg-tree-name">README.md</span>
        </TreeItemContent>
      </TreeItem>
    </Tree>
  );
}
