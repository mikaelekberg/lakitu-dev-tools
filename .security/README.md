# Security checks

All checks use free tools. GitHub Dependency Review is free for this public repository.

- **OpenGrep security scan** checks source and GitHub workflows with the local rules in
  `opengrep.yml`. It blocks dynamic code execution, direct HTML assignment, and selected
  untrusted GitHub event values interpolated into shell commands. JavaScript, TypeScript,
  and workflow rules use parsers; Svelte uses a limited text pattern check. This is a
  small set of guardrails, not comprehensive vulnerability or data flow analysis.
- **Dependency Review** blocks PR dependency changes with known high or critical
  vulnerabilities, including development and unknown scopes. It complements the existing
  full lockfile `npm audit` and scheduled audit. There is no license policy gate.
- Existing secret scanning, lint, types, unit tests, and browser tests remain in place.

Preview and production deployment wait for the application and security checks.
Dependency Review only scans PRs; the full npm audit also runs on main.

OpenGrep's executable is pinned to a version and verified SHA-256 in the validation
workflow. Rules live in the repository so changes are reviewable. To update OpenGrep,
verify the official release asset digest, update both values, and run the fixture tests
and repository scan. The CI fixture tests exercise unsafe and safe examples for each rule.

Run locally with an installed OpenGrep executable:

```sh
python3 scripts/test-security-rules.py /path/to/opengrep
/path/to/opengrep scan --config .security/opengrep.yml --error --strict --disable-version-check src .github/workflows
```

Investigate findings before adding exceptions. Prefer safer code; if an exception is
necessary, document the specific reviewed case and retain tests showing that unsafe
cases still fail. Existing reviewed Svelte HTML rendering is outside this small ruleset;
avoid treating a clean scan as proof that all HTML rendering is safe.
