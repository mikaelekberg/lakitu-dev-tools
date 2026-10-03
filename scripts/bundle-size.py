"""Compare gzip sizes of validated and baseline Cloudflare build assets."""

import gzip
import re
import sys
from pathlib import Path


def sizes(directory):
    root = Path(directory)
    if not root.is_dir():
        raise ValueError(f"Build directory missing: {root}")
    result = {}
    for path in root.rglob("*"):
        if path.is_file() and path.suffix in {".js", ".css", ".html"}:
            # Vite hashes can contain letters, digits, underscores and hyphens.
            name = re.sub(r"\.[A-Za-z0-9_-]{8}(?=\.(?:js|css|html)$)", ".*", str(path.relative_to(root)))
            result[name] = result.get(name, 0) + len(gzip.compress(path.read_bytes(), mtime=0))
    if not result:
        raise ValueError(f"No bundle assets found: {root}")
    return result


def report(before, after):
    old_total, new_total = sum(before.values()), sum(after.values())
    print("## Compressed bundle size\n")
    print(f"Total gzip size: **{new_total:,} B** ({new_total - old_total:+,} B versus base commit).\n")
    print("| Asset | Base (B) | PR (B) | Change (B) |")
    print("| --- | ---: | ---: | ---: |")
    changed = False
    for name in sorted(before.keys() | after.keys()):
        old, new = before.get(name, 0), after.get(name, 0)
        if abs(new - old) >= 100:
            changed = True
            print(f"| `{name}` | {old:,} | {new:,} | {new - old:+,} |")
    if not changed:
        print("| No individual changes of 100 B or more | | | |")


if __name__ == "__main__":
    report(sizes(sys.argv[1]), sizes(sys.argv[2]))
