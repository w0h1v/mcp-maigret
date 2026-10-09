# Changelog

## Unreleased

### Changed
- Upgraded `@modelcontextprotocol/sdk` from 0.4.0 to 1.x (and added `zod`). This removes the high-severity advisory on the old SDK. The `Server` constructor now passes `capabilities` as options, as the 1.x API requires.
- The default report `format` is now `txt` (was `pdf`), because the stock maigret image can't produce PDF reports.
- `package.json` `repository.url` now points at `w0h1v/mcp-maigret`, as npm provenance requires.
- Publishing uses npm trusted publishing (OIDC) instead of a stored token. The version bump is committed after a successful publish.

### Fixed
- `format: json` failed with current maigret, which now requires a report type (`--json simple`).
- `search_username` reported `report_<user>.json` and `report_<user>.html` paths that don't exist. Maigret writes `report_<user>_simple.json` and `report_<user>_plain.html`.
- `search_username` no longer says a report was saved when the file doesn't exist.

### Added
- Rewritten README, docs site, security policy, contributing guide, issue and pull request templates, and CI.

## 1.0.14 - 2026-10-09

First release published through the trusted publishing workflow. No functional changes from 1.0.13.

## 1.0.13 - 2026-10-09

### Security
- Fixed command injection vulnerabilities (CVE-2026-2130): usernames, URLs and tags are validated, and Docker is started with `execFile` and an argument array instead of a shell command.

1.0.13 was committed in January 2026 but only published to npm in October 2026, after its publish workflow failed and went unnoticed.
