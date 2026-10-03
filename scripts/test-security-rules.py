"""Check that the small OpenGrep ruleset catches unsafe examples and accepts safe ones."""

import json
import subprocess
import sys
import tempfile
from pathlib import Path


rules = Path(__file__).resolve().parents[1] / ".security/opengrep.yml"
with tempfile.TemporaryDirectory() as directory:
    root = Path(directory)
    fixtures = {
        "src/unsafe.ts": "eval(input);\nnew Function(input);\nelement.innerHTML = input;\n",
        "src/safe.ts": "JSON.parse(input);\nelement.textContent = input;\n",
        "src/Unsafe.svelte": "<script>eval(input);</script>\n",
        "src/Safe.svelte": "<script>const value = JSON.parse(input);</script><p>{value}</p>\n",
        ".github/workflows/unsafe.yml": 'steps:\n  - run: echo "${{ github.event.pull_request.title }}"\n',
        ".github/workflows/safe.yml": 'steps:\n  - env:\n      TITLE: ${{ github.event.pull_request.title }}\n    run: echo "$TITLE"\n',
    }
    for name, content in fixtures.items():
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
    result = subprocess.run(
        [sys.argv[1], "scan", "--config", str(rules), "--json", "--error", "--strict",
         "--disable-version-check", "--no-git-ignore", "src", ".github/workflows"],
        cwd=root, capture_output=True, text=True,
    )
    if result.returncode != 1:
        raise RuntimeError(f"Expected findings exit code 1, got {result.returncode}: {result.stderr}")
    report = json.loads(result.stdout)
    if report.get("errors"):
        raise RuntimeError(report["errors"])
    expected = {
        ("src/unsafe.ts", 1), ("src/unsafe.ts", 2), ("src/unsafe.ts", 3),
        ("src/Unsafe.svelte", 1), (".github/workflows/unsafe.yml", 2),
    }
    actual = {(finding["path"], finding["start"]["line"]) for finding in report["results"]}
    if actual != expected:
        raise AssertionError(f"Unexpected rule matches: {actual}; expected: {expected}")
    print("All four rules detect unsafe examples; safe examples produce no findings.")
