# Contributing to mcp-maigret

## Development setup

Requires Node.js 18 or later and Docker.

```sh
git clone https://github.com/w0h1v/mcp-maigret && cd mcp-maigret
npm install
npm run build
```

Run it against your own MCP client with `node build/index.js` and the `MAIGRET_REPORTS_DIR` environment variable set. The server runs maigret in Docker (`soxoj/maigret:latest`).

## Checks

There is no test suite yet. Before opening a pull request:

1. `npm run build` passes (TypeScript strict mode).
2. Run the server for real. Send `initialize` and `tools/list`, then call the tool you changed against the Docker image, with a harmless username such as `octocat`, and check the report file exists.
3. `npm audit --audit-level=high` is clean.

Tests are welcome. A small test setup that doesn't need Docker (for the validators) would be a good first contribution.

## Guidelines

- **Treat tool input as hostile.** Anything reaching `docker run` must be validated first and passed as an argument array to `execFile`. Never build a command string.
- **Don't trust maigret's flags to stay put.** Its options change between releases (`--json` now takes a type, and report file names carry suffixes). When you add or change a format, test it against the current image and say which maigret version you used.
- **Keep docs in step with code.** Update the README and `docs/` when tools, parameters, formats or requirements change.
- **No personal data.** Don't add real people's usernames or search results to code, docs, tests or issues.

## Pull requests

Keep changes focused, fill in the pull request template, and describe how you tested.

## Security issues

Do not open a public issue for a vulnerability. Follow [SECURITY.md](SECURITY.md).

## Code of conduct

Participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). By contributing, you agree that your contribution is licensed under the MIT license.
