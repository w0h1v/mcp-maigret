# Connect a client

mcp-maigret speaks MCP over stdio. Every client needs the same two things: how to start the server (`npx -y mcp-maigret`), and the `MAIGRET_REPORTS_DIR` environment variable.

## Requirements

- Node.js 18 or newer.
- Docker installed and running. The first search pulls the `soxoj/maigret:latest` image (about 800 MB).
- A writable reports directory. It is created if it doesn't exist.

## Claude Code

```sh
claude mcp add maigret -e MAIGRET_REPORTS_DIR="$HOME/maigret-reports" -- npx -y mcp-maigret
claude mcp get maigret      # should show: Connected
```

Start a new session to use the tools. Remove the server with `claude mcp remove maigret`.

## Claude Desktop

Edit the config file, then restart the app.

| OS | Path |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "maigret": {
      "command": "npx",
      "args": ["-y", "mcp-maigret"],
      "env": { "MAIGRET_REPORTS_DIR": "/absolute/path/to/maigret-reports" }
    }
  }
}
```

Use an absolute path. Desktop apps don't expand `~` or `$HOME`.

## Other MCP clients

Any client that can launch a stdio server works. Use command `npx`, arguments `-y mcp-maigret`, and the environment variable above. To run a global install instead, run `npm install -g mcp-maigret` and use the command `mcp-maigret`.

## From source

```sh
git clone https://github.com/w0h1v/mcp-maigret && cd mcp-maigret
npm install && npm run build
```

Use command `node` with the argument `/absolute/path/to/mcp-maigret/build/index.js`.

## Smithery

```sh
npx -y @smithery/cli install mcp-maigret --client claude
```

!!! note
    The server starts Docker containers, so it needs access to a Docker daemon. That doesn't work inside a hosted container without Docker, so prefer a local install.
