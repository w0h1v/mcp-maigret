"""MkDocs hooks: render README.md as the site home page.

Links that point into docs/ become site-relative; links to other repository files
become absolute GitHub URLs, so the same README works on GitHub and on the site.
"""

from __future__ import annotations

import re
from pathlib import Path

REPO = "https://github.com/w0h1v/mcp-maigret/blob/main/"


def _alerts(md: str) -> str:
    """GitHub ``> [!NOTE]`` alerts become MkDocs admonitions."""
    def repl(m: re.Match[str]) -> str:
        body = re.sub(r"^> ?", "    ", m.group(2), flags=re.M)
        return f"!!! {m.group(1).lower()}\n{body}"

    return re.sub(r"^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n((?:>.*\n?)+)", repl, md,
                  flags=re.M)


def _rewrite(md: str) -> str:
    def link(m: re.Match[str]) -> str:
        attr, target = m.group(1), m.group(2)
        if re.match(r"^[a-z]+:|^#", target):
            return m.group(0)
        if target.startswith("docs/"):
            return f'{attr}{target[len("docs/"):]}'
        return f"{attr}{REPO}{target}"

    md = re.sub(r'(\]\()([^)\s]+)', link, md)
    md = re.sub(r'((?:src|srcset|href)=")([^"]+)', link, md)
    return md


def on_page_markdown(markdown: str, page, config, files):  # noqa: ANN001 - mkdocs hook API
    if page.file.src_uri != "index.md":
        return markdown
    readme = Path(config["config_file_path"]).parent / "README.md"
    return _alerts(_rewrite(readme.read_text(encoding="utf-8")))
