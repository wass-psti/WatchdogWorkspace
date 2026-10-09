# Dependency Security

The v0.3.0 integration checkpoint removes the previously reported vulnerable export dependency families:

- `xlsx` (SheetJS npm 0.18.5) removed. XLSX export now uses an internal OOXML writer and the small `fflate` ZIP primitive.
- `jspdf` removed. PDF export now uses an internal deterministic PDF writer.
- `jspdf-autotable` removed.

`npm audit --omit=dev --audit-level=high` is a required fail-closed certification gate. The standalone Vite development server is bound to `127.0.0.1` only and is not part of the production bundle.

## M108 build-toolchain security corrective

The M107 clean-install audit on 2026-10-07 identified high-severity vulnerabilities in the isolated Material Tracker development/build dependency chain, including `braces` through Tailwind CSS 3 and `source-map-js`, plus the older Vite/esbuild toolchain. The `braces` advisory had no patched published `braces` release, so the corrective action does not waive or suppress the audit finding.

M108 migrates only the isolated build toolchain to exact supported versions: Tailwind CSS 4.3.3 with `@tailwindcss/vite` 4.3.3, Vite 8.3.3, and `@vitejs/plugin-react` 6.1.2. React 18 and all Material Tracker runtime/domain dependencies remain unchanged. The final remaining audit finding is remediated with an exact npm override to patched `source-map-js` 1.2.2; no audit waiver is used. Tailwind preflight remains disabled by importing only `theme.css` and `utilities.css`; the legacy JavaScript theme configuration is loaded explicitly with `@config` and source discovery is explicit.

The generated lockfile, clean install, complete npm audit, deterministic tests, import/export tests, production build, browser verification, and host regression gates are mandatory before the corrective checkpoint may be certified.
