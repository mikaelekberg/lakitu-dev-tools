# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |

Only the latest deployed version of tools.lakitu.dev receives security updates.

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**Please use GitHub Security Advisories to report vulnerabilities:**

1. Go to the [Security Advisories](https://github.com/anomalyco/lakitu-dev-tools/security/advisories) page
2. Click "Report a vulnerability"
3. Provide a detailed description of the vulnerability

**Do not** open a public GitHub issue for security vulnerabilities.

### What to Include

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Any suggested fixes (optional)

### Response Timeline

- **Acknowledgment**: Within 48 hours of report submission
- **Initial Assessment**: Within 5 business days
- **Resolution for Critical Issues**: Within 7 days
- **Resolution for Other Issues**: Within 30 days

### What to Expect

1. We will acknowledge receipt of your report
2. We will investigate and validate the issue
3. We will work on a fix and coordinate disclosure timing with you
4. We will credit you in the fix (unless you prefer to remain anonymous)

## Security Measures

This project implements the following security measures:

- **Dependency Scanning**: Automated npm audit runs weekly and on all PRs
- **Secret Scanning**: Automated scanning for accidentally committed secrets
- **Security Headers**: CSP, HSTS, X-Frame-Options, and other protective headers
- **TypeScript Strict Mode**: Catches potential issues at compile time
- **Input Validation**: All user inputs are validated before processing
- **XSS Prevention**: Proper escaping for any dynamic HTML rendering

## Scope

This security policy applies to:

- The tools.lakitu.dev website and all its tools
- The source code in this repository

Out of scope:

- Third-party services and dependencies (report to respective maintainers)
- Social engineering attacks
- Denial of service attacks against infrastructure

Thank you for helping keep tools.lakitu.dev secure!
