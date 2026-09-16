import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const workflowPath = resolve(root, '.github/workflows/m42-certified-baseline.yml');
const source = readFileSync(workflowPath, 'utf8');
const requireText = (needle, label) => {
  if (!source.includes(needle)) throw new Error(`M42 hosted certification workflow missing ${label}: ${needle}`);
};
const rejectText = (needle, label) => {
  if (source.includes(needle)) throw new Error(`M42 hosted certification workflow must not contain ${label}: ${needle}`);
};

requireText('workflow_dispatch:', 'manual dispatch trigger');
requireText('expected_commit_sha:', 'required exact revision input');
requireText('required: true', 'required exact revision input enforcement');
requireText('permissions:\n  contents: read', 'read-only repository permissions');
requireText('timeout-minutes: 120', 'bounded certification timeout');
requireText('node-version: 22.16.0', 'governed Node version');
requireText('version: 2.117.0', 'governed Supabase CLI version');
requireText("test \"$(npm --version)\" = \"10.9.2\"", 'governed npm version check');
requireText('test "${{ inputs.expected_commit_sha }}" = "$GITHUB_SHA"', 'exact Git revision guard');
requireText("docker version --format '{{.Server.Version}}'", 'Docker daemon capability check');
requireText('bash scripts/finalize-stage-g-m42.sh', 'single fail-closed finalizer authority');
requireText('Work-Management-App-v1.43.2-Stage-G-M42-Certified-Baseline.zip', 'certified ZIP verification');
requireText('CERTIFIED ZIP SHA-256: $SHA', 'PASS-record ZIP digest binding');
requireText('CERTIFIED SOURCE TREE SHA-256: $SOURCE_SHA', 'PASS-record source-tree digest binding');
requireText('CERTIFIED SOURCE COMMIT: $GITHUB_SHA', 'PASS-record source commit binding');
requireText('stage-g-m42-certification-tree.mjs .', 'hosted source-tree digest recomputation');
requireText("grep -Fq -- '- **State:** active-certified'", 'certified state verification');
requireText('sha256sum -c CHECKSUMS.sha256', 'published baseline checksum verification');
requireText('actions/upload-artifact@v4', 'certified artifact upload');
requireText('Stage verified M42 artifacts for upload', 'verified artifact staging step');
requireText('STAGE_DIR="m42-certified-artifacts-upload"', 'repository-local upload staging directory');
requireText('cp "../$ZIP" "$STAGE_DIR/$ZIP"', 'certified ZIP staging copy');
requireText('cp "../$PASS" "$STAGE_DIR/$PASS"', 'PASS-record staging copy');
requireText('cmp -s "../$ZIP" "$STAGE_DIR/$ZIP"', 'certified ZIP byte-identity check');
requireText('cmp -s "../$PASS" "$STAGE_DIR/$PASS"', 'PASS-record byte-identity check');
requireText('m42-certified-artifacts-upload/Work-Management-App-v1.43.2-Stage-G-M42-Certified-Baseline.zip', 'repository-local certified ZIP upload path');
requireText('m42-certified-artifacts-upload/Work-Management-App-v1.43.2-Stage-G-M42-Certified-Baseline-PASS.txt', 'repository-local PASS-record upload path');
const uploadBlock = source.slice(source.indexOf('- name: Upload certified M42 baseline'));
if (uploadBlock.includes('../')) throw new Error('M42 hosted certification upload step must not traverse outside the workspace with ..');
requireText('if-no-files-found: error', 'fail-closed artifact publication');
rejectText('continue-on-error:', 'continue-on-error bypass');
rejectText('users-rbac-recovery:activate:release', 'direct activation bypass outside finalizer');
rejectText('users-rbac-recovery:certify', 'standalone certification bypass outside finalizer');

console.log('Stage G M42 hosted certification workflow verification: PASS');
