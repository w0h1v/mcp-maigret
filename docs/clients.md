# Connect a client

mcp-maigret speaks MCP over stdio. Every client needs the same two things: how to start the server (`npx -y mcp-maigret`), and the `MAIGRET_REPORTS_DIR` environment variable.

## Requirements

- Node.js 18 or newer.
- Maigret, in one of two ways:
  - **Docker** (default): Docker installed and running. The first search pulls the `soxoj/maigret:latest` image (about 800 MB).
  - **Local**: a `maigret` command on `PATH`, for example `pipx install 'maigret[pdf]'`. No Docker needed, and PDF reports work.

`MAIGRET_RUNNER` picks one: `docker`, `local`, or `auto` (the default, which uses a local `maigret` when one is installed and Docker otherwise). This repo's Docker image bundles maigret 0.6.6 with the `pdf` extra and sets `MAIGRET_RUNNER=local`, so it runs without a Docker daemon.
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
