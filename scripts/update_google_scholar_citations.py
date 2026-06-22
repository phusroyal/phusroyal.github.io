#!/usr/bin/env python3
"""Update cached Google Scholar citation counts for Jekyll publications."""

from __future__ import annotations

import argparse
import datetime as dt
import html
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PUBLICATIONS_DIR = ROOT / "_publications"
CITATIONS_FILE = ROOT / "_data" / "citations.yml"
SCHOLAR_BASE = "https://scholar.google.com"


def strip_quotes(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def read_front_matter(path: Path) -> dict[str, str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        return {}

    fields: dict[str, str] = {}
    for line in lines[1:]:
        if line.strip() == "---":
            break
        match = re.match(r"^([A-Za-z0-9_-]+):\s*(.*)$", line)
        if match:
            key, value = match.groups()
            fields[key] = strip_quotes(value)
    return fields


def publication_entries() -> list[dict[str, str]]:
    entries = []
    for path in sorted(PUBLICATIONS_DIR.rglob("*.md")):
        fields = read_front_matter(path)
        title = fields.get("title")
        if not title:
            continue
        entries.append(
            {
                "slug": path.stem,
                "title": title,
                "query": fields.get("scholar_query") or title,
            }
        )
    return entries


def parse_scalar(value: str) -> str | int | None:
    value = strip_quotes(value)
    if value == "":
        return None
    if value.isdigit():
        return int(value)
    return value


def load_cache(path: Path) -> dict[str, dict[str, str | int | None]]:
    if not path.exists():
        return {}

    cache: dict[str, dict[str, str | int | None]] = {}
    current_key: str | None = None
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        key_match = re.match(r"^([A-Za-z0-9_-]+):\s*$", line)
        if key_match:
            current_key = key_match.group(1)
            cache[current_key] = {}
            continue
        value_match = re.match(r"^\s+([A-Za-z0-9_-]+):\s*(.*)$", line)
        if current_key and value_match:
            key, value = value_match.groups()
            cache[current_key][key] = parse_scalar(value)
    return cache


def quote_yaml(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def write_cache(path: Path, cache: dict[str, dict[str, str | int | None]]) -> None:
    lines: list[str] = []
    for slug in sorted(cache):
        entry = cache[slug]
        lines.append(f"{slug}:")
        count = entry.get("count")
        lines.append(f"  count: {count}" if isinstance(count, int) else "  count:")
        for field in ("url", "updated"):
            value = entry.get(field)
            lines.append(f"  {field}: {quote_yaml(str(value))}" if value else f"  {field}:")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def scholar_search_url(query: str) -> str:
    return f"{SCHOLAR_BASE}/scholar?hl=en&q={urllib.parse.quote_plus(query)}"


def fetch_scholar_count(query: str, timeout: int) -> tuple[int, str]:
    request = urllib.request.Request(
        scholar_search_url(query),
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        page = response.read().decode("utf-8", errors="replace")

    match = re.search(
        r'href="(?P<href>/scholar\?cites=[^"]+)"[^>]*>\s*Cited by\s+(?P<count>[\d,]+)\s*</a>',
        page,
        flags=re.IGNORECASE,
    )
    if match:
        count = int(match.group("count").replace(",", ""))
        return count, SCHOLAR_BASE + html.unescape(match.group("href"))

    count_match = re.search(r"Cited by\s+([\d,]+)", page, flags=re.IGNORECASE)
    if count_match:
        return int(count_match.group(1).replace(",", "")), scholar_search_url(query)

    raise RuntimeError("no Google Scholar citation count found")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", help="Update a single publication slug, e.g. 2023-vihos")
    parser.add_argument("--sleep", type=float, default=5.0, help="Seconds to wait between Scholar requests")
    parser.add_argument("--timeout", type=int, default=20, help="HTTP timeout in seconds")
    parser.add_argument("--dry-run", action="store_true", help="Print updates without writing citations.yml")
    args = parser.parse_args()

    publications = publication_entries()
    if args.only:
        publications = [item for item in publications if item["slug"] == args.only]
        if not publications:
            print(f"No publication found for slug: {args.only}", file=sys.stderr)
            return 1

    cache = load_cache(CITATIONS_FILE)
    today = dt.date.today().isoformat()

    for index, publication in enumerate(publications):
        slug = publication["slug"]
        cache.setdefault(slug, {"count": None, "url": None, "updated": None})
        print(f"Updating {slug}: {publication['title']}")
        try:
            count, url = fetch_scholar_count(publication["query"], args.timeout)
        except (RuntimeError, urllib.error.URLError, TimeoutError) as error:
            print(f"  kept existing cache; Scholar lookup failed: {error}")
        else:
            cache[slug] = {"count": count, "url": url, "updated": today}
            print(f"  {count} citations")

        if index < len(publications) - 1 and args.sleep > 0:
            time.sleep(args.sleep)

    if args.dry_run:
        for slug in sorted(cache):
            print(slug, cache[slug])
    else:
        write_cache(CITATIONS_FILE, cache)
        print(f"Wrote {CITATIONS_FILE.relative_to(ROOT)}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
