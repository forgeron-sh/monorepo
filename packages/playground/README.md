# @forgeron/playground

The playground page: the list of a tool's actions, a generated form for each one, the result, and what MCP, the API and the CLI see of it (`docs/sdk.md` §7; `docs/white-paper.md`, "The playground").

One document, no dependency and no build step. `forgeron play` serves it locally and the gateway serves it at `/t/<tool>/play`: `playgroundHtml` takes the path the tool is mounted at and where to read its manifest.
