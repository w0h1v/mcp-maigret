# Troubleshooting

## The tools don't show up

1. Restart the client. Clients only load MCP servers at startup.
2. In Claude Code, run `claude mcp get maigret`. It should say **Connected**.
3. Run the server yourself to see its errors: `MAIGRET_REPORTS_DIR=/tmp/maigret npx -y mcp-maigret`. It logs to stderr and waits for MCP messages on stdin.

## Docker

```sh
docker --version
docker ps
docker run --rm soxoj/maigret:latest --version
```

- `Docker is not installed or not running`: install Docker and start the daemon.
- Permission denied on Linux: `sudo usermod -aG docker $USER`, then log out and back in.
- The first search is slow because it pulls the image (about 800 MB).

## Reports directory

- `MAIGRET_REPORTS_DIR environment variable must be set`: add it to the `env` block of your client config. The server won't start without it.
- Use an absolute path, with no trailing slash. Desktop apps don't expand `~`.
- Your user needs write access: `ls -ld "$MAIGRET_REPORTS_DIR"`.
- Docker Desktop must be allowed to share the directory. On macOS, folders outside your home directory may need to be added under Docker Desktop's file sharing settings.

## Error messages

| Message | Meaning and fix |
|---|---|
| `Docker is not installed or not running` | Install Docker and start the daemon |
| `MAIGRET_REPORTS_DIR environment variable must be set` | Set the variable in your client config |
| `Error creating reports directory` | Check the path and permissions |
| `Invalid username` | Use only letters, digits, `_`, `-`, `.` (max 100) |
| `Invalid tag` | Use only letters, digits, `_`, `-` (max 50) |
| `Invalid URL` | Use a plain `http` or `https` URL without shell metacharacters |
| `No report file was produced at ...` | The format isn't available in the image. Use `txt`, `csv`, `json`, `html` or `xmind`. |
| `Error executing maigret` | The Docker output is included in the message. Often a network problem, or a maigret option that changed. |

## Results look wrong

Username search is heuristic. Maigret reports a profile as found when a site responds in a certain way, and sites change. Expect some false positives and misses, and verify results by hand. Report site-detection problems to the [maigret project](https://github.com/soxoj/maigret/issues).

## Slow or rate-limited searches

- Narrow with `tags` instead of `use_all_sites`.
- Some sites throttle or block repeated automated lookups from one address.
