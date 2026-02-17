# Supply Chain & Dependency Hardening Policy

## 1. Installation Integrity

- **Lockfile Enforcement**: All installations MUST use `pnpm install --frozen-lockfile`.
- **CI Check**:
  ```yaml
  - name: Install Dependencies
    run: pnpm install --frozen-lockfile
  ```

## 2. Vulnerability Auditing

- **Automated Audit**:
  - `pnpm audit --prod --audit-level high`
  - MUST pass in CI/CD before deployment.
- **Resolution**:
  - High/Critical vulnerabilities MUST be patched within 24 hours.
  - Advisory overrides are permitted ONLY with Staff Engineer approval.

## 3. Dependency Verification

- **Pinning**: No version ranges (`^` or `~`) allowed for critical dev dependencies (e.g., `webpack`, `next`).
- **Review**: New dependencies require specific approval in PRs.

## 4. Minimal Footprint

- **Tree-Shaking**: Ensure imports are tree-shakeable.
- **Bundle Analysis**: `next-bundle-analyzer` run on major updates.

## 5. Secret Hygiene

- **Service Role Key**: NEVER in client bundles.
- **Leak Detection**: Automated scan of `process.env` keys starting with `NEXT_PUBLIC_` to ensure they don't contain secrets.
