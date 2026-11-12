// A marketplace's own files (D-115, D-121): its index and the workflow that publishes a tool on a tag.
import { CLAUDE_MD, marketplaceAgents } from "./agents";
import { LIFECYCLE, LIFECYCLE_PATH } from "./lifecycle";

export const MARKETPLACE_INDEX_PATH = "forgeron-marketplace.json";
const RELEASE_WORKFLOW_PATH = ".github/workflows/release.yml";

/** Publishes a tool on a tag \`<tool>@<version>\` (written by \`forgeron release\`). */
const RELEASE_WORKFLOW = `# Publishes a tool of this marketplace on a tag <tool>@<version>, written by \`forgeron release\`:
# tests it, bundles it, attaches the bundle to the tag's release and updates forgeron-marketplace.json.
name: release
on:
  push:
    tags: ["*@*"]
permissions:
  contents: write
concurrency: marketplace-index
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: The tool and version of the tag
        id: tag
        run: |
          tag="\${GITHUB_REF_NAME}"
          echo "tool=\${tag%@*}" >> "$GITHUB_OUTPUT"
          echo "version=\${tag#*@}" >> "$GITHUB_OUTPUT"
      # The code of the tag, as it was released.
      - uses: actions/checkout@v4
        with: { ref: "\${{ github.ref }}" }
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - name: Test and bundle
        working-directory: tools/\${{ steps.tag.outputs.tool }}
        run: |
          bunx forgeron test
          bunx forgeron bundle --out "$RUNNER_TEMP/bundle"
      - name: Attach the bundle to the release
        env:
          GH_TOKEN: \${{ github.token }}
          TOOL: \${{ steps.tag.outputs.tool }}
          VERSION: \${{ steps.tag.outputs.version }}
        run: |
          file="$RUNNER_TEMP/bundle/$TOOL-$VERSION.forgeron.json"
          gh release view "$GITHUB_REF_NAME" >/dev/null 2>&1 || gh release create "$GITHUB_REF_NAME" --title "$GITHUB_REF_NAME" --notes "See the tool's CHANGELOG.md."
          gh release upload "$GITHUB_REF_NAME" "$file" --clobber
          echo "SHA=$(sha256sum "$file" | cut -d' ' -f1)" >> "$GITHUB_ENV"
      # The index lives on main: checked out apart, so the tag's files are left as they are.
      - uses: actions/checkout@v4
        with: { ref: main, path: index }
      - name: Update the index
        working-directory: index
        env:
          TOOL: \${{ steps.tag.outputs.tool }}
          VERSION: \${{ steps.tag.outputs.version }}
        run: |
          jq --arg t "$TOOL" --arg v "$VERSION" --arg r "$GITHUB_REF_NAME" --arg a "$TOOL-$VERSION.forgeron.json" --arg s "$SHA" \\
            '.tools |= map(if .name == $t then .version = $v | .release = $r | .asset = $a | .sha256 = $s else . end)' \\
            forgeron-marketplace.json > index.json && mv index.json forgeron-marketplace.json
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git commit -am "chore(marketplace): $GITHUB_REF_NAME" && git push origin main
`;

/** A new marketplace: its index with no tool yet, its release workflow, and what an agent reads. */
export function marketplaceFiles(name: string): Record<string, string> {
  return {
    "package.json": `${JSON.stringify(
      {
        name,
        private: true,
        type: "module",
        workspaces: ["tools/*"],
        scripts: { test: "bun run --filter '*' test" },
      },
      null,
      2,
    )}\n`,
    [MARKETPLACE_INDEX_PATH]: `${JSON.stringify({ name, title: name, tools: [] }, null, 2)}\n`,
    [RELEASE_WORKFLOW_PATH]: RELEASE_WORKFLOW,
    "AGENTS.md": marketplaceAgents(name),
    "CLAUDE.md": CLAUDE_MD,
    [LIFECYCLE_PATH]: LIFECYCLE,
    "tools/.gitkeep": "",
    ".gitignore": "node_modules/\n.forgeron/bundle/\n",
  };
}
