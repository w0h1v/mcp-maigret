# Tool reference

Both tools return text. Input is validated before anything reaches Docker, and a failed validation returns an error without running maigret.

## `search_username`

Search for a username across social networks and sites.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `username` | string, required | | `A-Z a-z 0-9 _ - .` only, 1 to 100 characters |
| `format` | enum | `txt` | `txt`, `html`, `csv`, `json`, `xmind`, `pdf` |
| `use_all_sites` | boolean | `false` | Check every site in maigret's database, not just the top 500 |
| `tags` | string[] | none | Only check sites with these tags. `A-Z a-z 0-9 _ -` only, up to 50 characters each |

Under the hood the server runs `docker run --rm -v <reports dir>:/app/reports soxoj/maigret:latest <username> <format flag> --no-color --no-progressbar -n 200 [-a] [--tags ...]`.

The response starts with the report path (or a note that no report was produced), followed by maigret's console output.

### Output formats

| Format | File | Status |
|---|---|---|
| `txt` | `report_<username>.txt` | Works. Default. |
| `csv` | `report_<username>.csv` | Works |
| `json` | `report_<username>_simple.json` | Works. Sent to maigret as `--json simple`. |
| `html` | `report_<username>_plain.html` | Works |
| `xmind` | `report_<username>.xmind` | Works |
| `pdf` | `report_<username>.pdf` | Not available with the stock image |

Checked against maigret 0.6.6 on `soxoj/maigret:latest` in October 2026.

When maigret finds related usernames it may write extra reports next to the main one, for example `report_octocatsup.txt`. The response only names the main file, so list the reports directory to see them all.

!!! warning "PDF"
    Maigret's PDF support is an optional extra (`pip install 'maigret[pdf]'`) that the `soxoj/maigret` image doesn't include. The tool tells you when the file wasn't produced. To get PDFs, build your own image with the extra and change `DOCKER_IMAGE` in `src/index.ts`.

## `parse_url`

Parse a URL to extract information and search for associated usernames.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `url` | string, required | | `http` or `https`, no shell metacharacters |
| `format` | enum | `txt` | Same options as above |

The server runs `docker run ... --parse <url> <format flag> --no-color --no-progressbar --timeout 60 -n 200`. The result is maigret's scan output as text.

## Version drift

The server pulls `soxoj/maigret:latest`, so maigret updates can change behaviour without a new mcp-maigret release. Report differences in the [issue tracker](https://github.com/w0h1v/mcp-maigret/issues/new/choose), with the output of `docker run --rm soxoj/maigret:latest --version`.
