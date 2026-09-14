# M42 Hosted Fail-Closed Certification Workflow Corrective

## Problem

The M42 certification implementation correctly required a clean npm dependency materialization and a disposable Supabase pgTAP Database/RLS stack, but the continuation environment could provide neither npm registry resolution nor a Docker-compatible runtime. The repository already used GitHub-hosted runners for both capabilities, yet M42 had no governed workflow that executed the actual transactional finalizer and published its certified ZIP/PASS record.

## Corrective

`.github/workflows/m42-certified-baseline.yml` is now the governed hosted certification entrypoint. It is manual-dispatch only, read-only against repository contents, pins Node 22.16.0 and Supabase CLI 2.117.0, verifies npm 10.9.2 plus a live Docker daemon, and delegates the complete milestone transaction to `scripts/finalize-stage-g-m42.sh`.

The workflow does not call activation or standalone certification directly. The finalizer remains the single authority for preflight, clean dependency materialization, browser/database/historical/release gates, dual-record activation rollback, package hygiene, certified ZIP creation, and PASS-record publication.

After the finalizer returns successfully, the workflow independently verifies ZIP integrity, ZIP SHA-256/PASS-record binding, `active-certified` release status, and the certified directory checksum manifest before uploading only the certified ZIP and PASS record as a retained GitHub Actions artifact.

A deterministic repository-level verifier, `scripts/verify-stage-g-m42-hosted-certification-workflow.mjs`, rejects missing pins, missing Docker/Supabase capability checks, direct activation/certification bypasses, `continue-on-error`, or fail-open artifact publication.

## Result

This removes the requirement for the developer workstation or ChatGPT execution sandbox itself to provide npm network access or Docker. Formal M42 completion still requires one successful execution of this hosted workflow (or an equivalent certification-capable environment) against the exact candidate source revision. No PASS record or certified baseline is created until the finalizer succeeds.
