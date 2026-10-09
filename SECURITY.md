# Security policy

mcp-maigret is an independent project and is not affiliated with the maigret project.

## Supported versions

Only the latest release receives security fixes.

| Version | Supported |
|---|---|
| Latest release | Yes |
| Older releases | No |

Releases before 1.0.13 are affected by a command injection vulnerability (CVE-2026-2130) and should not be used. Upgrade to 1.0.13 or later.

## Reporting a vulnerability

Use GitHub private vulnerability reporting. Open the repository's **Security** tab and choose **Report a vulnerability**. Do not open a public issue or pull request for a suspected vulnerability.

Include:

- The mcp-maigret version or commit, and your Node, Docker and maigret versions.
- Steps to reproduce, and the expected and actual results.
- The impact you believe the issue has.

Do not include real people's personal information or credentials in a report.

## Scope

In scope:

- **Command injection or argument injection** through `username`, `url`, `tags`, `format` or any other tool input, including inputs that reach `docker run` as extra options.
- **Path traversal** that reads or writes outside `MAIGRET_REPORTS_DIR`, for example through crafted usernames.
- **Validation bypass** of the username, URL and tag checks.
- **Credential or secret leakage** in logs or error messages the server produces.

Out of scope:

- **Maigret, Docker and the `soxoj/maigret` image.** Report these to their own projects.
- **Behaviour of the sites being searched**, including false positives and rate limiting.
- **Misuse of the tool.** The server performs OSINT lookups on request. Whether a given lookup is lawful or ethical is up to the operator.
- **Local attackers with the same OS user**, who can already run Docker and read the reports directory.
- **Automated scanner findings** without a working reproduction.

## Trust model

The server runs on your machine with your Docker access, on behalf of an MCP client you configured. It treats tool arguments as untrusted: it validates them, and starts Docker with `execFile` and an argument array so no shell is involved. It does not authenticate the MCP client, which talks to it over stdio as the same OS user. Run it only for agents you trust.

Reports are written to a single mounted directory and are not encrypted. Searches make requests from your IP address to many third-party sites.
