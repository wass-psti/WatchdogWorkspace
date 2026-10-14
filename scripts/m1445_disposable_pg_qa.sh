#!/bin/bash
# M144.5: strictly disposable local PostgreSQL acceptance; never contacts hosted database.
set -Eeuo pipefail
umask 077
export PYTHONDONTWRITEBYTECODE=1

fail() { printf 'BLOCKED: %s\n' "$*" >&2; exit 2; }
[[ "$#" == 2 ]] || fail 'usage: m1445_disposable_pg_qa.sh <source-tree> <new-evidence-directory>'
ROOT="$1"
EVIDENCE="$2"
[[ -d "$ROOT" && ! -L "$ROOT" ]] || fail 'source tree missing or symlink'
[[ ! -e "$EVIDENCE" && ! -L "$EVIDENCE" ]] || fail 'evidence destination must not already exist'
[[ "$EVIDENCE" != "$ROOT" && "$EVIDENCE" != "$ROOT/"* ]] || fail 'evidence must be outside source tree'
for cmd in docker python3 shasum;do command -v "$cmd" >/dev/null || fail "missing dependency: $cmd";done
[[ -z "${DOCKER_HOST:-}" && -z "${DOCKER_CONTEXT:-}" && -z "${DOCKER_TLS_VERIFY:-}" && -z "${DOCKER_CERT_PATH:-}" ]] || fail 'explicit Docker remote/context overrides forbidden'
DOCKER_ENDPOINT="$(docker context inspect --format '{{ (index .Endpoints "docker").Host }}' 2>/dev/null)" || fail 'cannot inspect current Docker context'
[[ "$DOCKER_ENDPOINT" == unix:///* ]] || fail 'Docker context must be a local Unix socket'
[[ "$(docker info --format '{{.OSType}}' 2>/dev/null)" == linux ]] || fail 'Linux container daemon unavailable'

SQL="$ROOT/supabase/m143/board_import_wizard_atomic_DRAFT.sql"
FIXTURE="$ROOT/supabase/tests/m143/m1432_isolated_postgresql_fixture.sql"
TESTS="$ROOT/supabase/tests/m143/m1432_atomic_behavior.test.sql"
for f in "$SQL" "$FIXTURE" "$TESTS";do [[ -f "$f" && ! -L "$f" ]] || fail "missing source fixture: $f";done
printf '%s  %s\n' \
 'b883b3c432ae5ebcadd9fda2f15b5bcdeb0cff9448ace4862c6fb88fd5fd37fc' "$SQL" \
 '4666aeab87dbfdf11fb7c15fdad72fbf95fa4db68cfd19d471504c0d086cd1a2' "$FIXTURE" \
 'c9d8b05224989b27a9e8a8f79dd01033f913daa4bd6322333e212c2398584b5b' "$TESTS" | shasum -a 256 -c - || fail 'SQL fixture input changed'

mkdir -m 700 "$EVIDENCE"
DB="m1445-pg-$(python3 -c 'import secrets;print(secrets.token_hex(6))')"
PASSWORD="$(python3 -c 'import secrets;print(secrets.token_urlsafe(36))')"
IMAGE='postgres:16-alpine'
COMPLETE=0
cleanup() {
  rc=$?
  trap - EXIT HUP INT TERM
  if [[ -n "${DB:-}" ]];then docker rm -f "$DB" >/dev/null 2>&1 || true;fi
  if [[ "$COMPLETE" != 1 || "$rc" != 0 ]];then
    rm -f "$EVIDENCE/M144_5-DISPOSABLE-POSTGRES-PASS-NOT-RELEASE-CERTIFIED.txt" 2>/dev/null || true
    printf 'M144.5 disposable DB check FAILED or interrupted; see logs under %s\n' "$EVIDENCE" >&2
  fi
  exit "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

printf '========== 01 BOOT DISPOSABLE POSTGRESQL (NO NETWORK) ==========\n'
# Explicit image/version contract; record image ID for replay. No host mounts/ports/networks.
docker image inspect "$IMAGE" >/dev/null 2>&1 || docker pull "$IMAGE" >/dev/null || fail 'PostgreSQL image unavailable'
IMAGE_ID="$(docker image inspect "$IMAGE" --format '{{.Id}}')"
[[ "$IMAGE_ID" == sha256:* ]] || fail 'Docker image digest unavailable'
printf 'Docker image: %s\nImage ID: %s\nDocker endpoint: %s\n' "$IMAGE" "$IMAGE_ID" "$DOCKER_ENDPOINT" > "$EVIDENCE/M144_5-POSTGRES-ENVIRONMENT.txt"
docker run -d --name "$DB" --network none --security-opt no-new-privileges \
 -e POSTGRES_DB=m1445qa -e "POSTGRES_PASSWORD=$PASSWORD" "$IMAGE" > "$EVIDENCE/M144_5-CONTAINER-ID.txt" || fail 'PostgreSQL start failed'
unset PASSWORD
for i in $(seq 1 50);do
  if docker exec "$DB" pg_isready -U postgres -d m1445qa >/dev/null 2>&1;then break;fi
  sleep 1
done
docker exec "$DB" pg_isready -U postgres -d m1445qa >/dev/null || fail 'PostgreSQL readiness failed'
docker inspect "$DB" | python3 -c '
import json,sys
c=json.load(sys.stdin)[0]
assert c["HostConfig"]["NetworkMode"]=="none", "database has network connectivity"
assert not c["HostConfig"]["PortBindings"], "unexpected port bindings"
assert not c["HostConfig"]["Binds"], "unexpected host mounts"
print("PASS: isolated Docker container, no published ports, no network or host binds")
' || fail 'Docker isolation contract failed'
pg() { docker exec -i "$DB" psql -X -v ON_ERROR_STOP=1 -U postgres -d m1445qa "$@"; }
VERSION="$(pg -Atc 'show server_version_num')"
[[ "$VERSION" =~ ^[0-9]+$ ]] || fail 'unparseable PostgreSQL version'
(( VERSION >= 160000 && VERSION < 170000 )) || fail 'PostgreSQL major version 16 required'
printf 'PostgreSQL server_version_num: %s\n' "$VERSION" >> "$EVIDENCE/M144_5-POSTGRES-ENVIRONMENT.txt"

printf '========== 02 CREATE SOURCE-PINNED DISPOSABLE FIXTURE ==========\n'
pg < "$FIXTURE" > "$EVIDENCE/01-fixture.log" 2>&1 || { tail -55 "$EVIDENCE/01-fixture.log" >&2; fail 'fixture installation failed'; }
[[ "$(pg -Atc "select case when to_regprocedure('public.wm_import_board_wizard_atomic(uuid,timestamptz,jsonb)') is null then 'absent' else 'present' end")" == absent ]] || fail 'RPC unexpectedly preinstalled'

printf '========== 03 VERIFY ROLLBACK OF PROPOSED DDL ==========\n'
{
  printf 'BEGIN;\n'
  cat "$SQL"
  printf '\nROLLBACK;\n'
  cat <<'SQLCHECK'
DO $$ BEGIN
 IF to_regprocedure('public.wm_import_board_wizard_atomic(uuid,timestamptz,jsonb)') IS NOT NULL THEN
   RAISE EXCEPTION 'DDL rollback left the RPC installed';
 END IF;
 RAISE NOTICE 'PASS: DDL transaction rollback removes new function and grants';
END $$;
SQLCHECK
} | pg > "$EVIDENCE/02-migration-rollback.log" 2>&1 || { tail -60 "$EVIDENCE/02-migration-rollback.log" >&2; fail 'DDL rollback contract failed'; }

printf '========== 04 APPLY DDL IN DISPOSABLE TEST DATABASE ==========\n'
{
  printf 'BEGIN;\n'
  cat "$SQL"
  printf '\nCOMMIT;\n'
} | pg > "$EVIDENCE/03-isolated-install.log" 2>&1 || { tail -60 "$EVIDENCE/03-isolated-install.log" >&2; fail 'isolated migration installation failed'; }
pg <<'SQLCHECK' > "$EVIDENCE/04-acl-and-rls.log" 2>&1 || { tail -60 "$EVIDENCE/04-acl-and-rls.log" >&2; fail 'ACL/RLS contract failed'; }
DO $$ DECLARE function_oid oid; BEGIN
 function_oid:=to_regprocedure('public.wm_import_board_wizard_atomic(uuid,timestamptz,jsonb)');
 IF function_oid IS NULL THEN RAISE EXCEPTION 'RPC missing after install'; END IF;
 IF NOT (SELECT prosecdef FROM pg_proc WHERE oid=function_oid) THEN RAISE EXCEPTION 'RPC not SECURITY DEFINER'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE oid=function_oid AND proconfig @> ARRAY['search_path=pg_catalog, public']) THEN
    RAISE EXCEPTION 'RPC search_path not pinned';
 END IF;
 IF NOT has_function_privilege('authenticated',function_oid,'EXECUTE') THEN RAISE EXCEPTION 'authenticated cannot execute'; END IF;
 IF has_function_privilege('anon',function_oid,'EXECUTE') OR EXISTS (
   SELECT 1 FROM pg_proc p, LATERAL aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) acl
   WHERE p.oid=function_oid AND acl.grantee=0 AND acl.privilege_type='EXECUTE'
 ) THEN
   RAISE EXCEPTION 'unexpected public/anon EXECUTE';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_class WHERE oid IN (
   'public.work_boards'::regclass,'public.work_board_members'::regclass,
   'public.work_board_items'::regclass,'public.work_board_columns'::regclass,
   'public.work_board_item_values'::regclass,'public.work_board_groups'::regclass,
   'public.work_board_events'::regclass) AND NOT relrowsecurity) THEN
    RAISE EXCEPTION 'fixture table RLS disabled';
 END IF;
 RAISE NOTICE 'PASS: SECURITY DEFINER, strict RPC grants, fixed search_path and fixture RLS';
END $$;
SQLCHECK

printf '========== 05 RUN EXISTING M143 ATOMIC SECURITY TEST SUITE ==========\n'
pg < "$TESTS" > "$EVIDENCE/05-existing-atomic-suite.log" 2>&1 || { tail -80 "$EVIDENCE/05-existing-atomic-suite.log" >&2; fail 'M143 behavioral/authorization tests failed'; }
[[ "$(grep -c 'NOTICE:  PASS:' "$EVIDENCE/05-existing-atomic-suite.log")" -ge 11 ]] || fail 'insufficient PASS assertions from M143 suite'

printf '========== 06 ASSERT FIXTURE INVARIANTS AFTER TEST ==========\n'
pg <<'SQLCHECK' > "$EVIDENCE/06-after-behavior.log" 2>&1 || fail 'post-test invariants failed'
DO $$ BEGIN
 IF (SELECT count(*) FROM public.work_board_groups)<>1 OR
    (SELECT count(*) FROM public.work_board_items)<>2 OR
    (SELECT count(*) FROM public.work_board_columns)<>3 OR
    (SELECT count(*) FROM public.work_board_events)<>0 THEN
      RAISE EXCEPTION 'persistent fixture drift after tests';
 END IF;
 RAISE NOTICE 'PASS: no persistent import changes after test rollbacks';
END $$;
SQLCHECK

printf '========== 07 VERIFY FUNCTION ROLLBACK AND RECOVERY ==========\n'
# Simulate attempted rollback that aborts, then committed removal in disposable DB only.
pg <<'SQLCHECK' > "$EVIDENCE/07-rollback-recovery.log" 2>&1 || fail 'rollback simulation failed'
BEGIN;
DROP FUNCTION public.wm_import_board_wizard_atomic(uuid,timestamptz,jsonb);
ROLLBACK;
DO $$ BEGIN
 IF to_regprocedure('public.wm_import_board_wizard_atomic(uuid,timestamptz,jsonb)') IS NULL THEN
   RAISE EXCEPTION 'aborted rollback removed live function';
 END IF;
 RAISE NOTICE 'PASS: aborted removal preserves deployed function';
END $$;
BEGIN;
DROP FUNCTION public.wm_import_board_wizard_atomic(uuid,timestamptz,jsonb);
COMMIT;
DO $$ BEGIN
 IF to_regprocedure('public.wm_import_board_wizard_atomic(uuid,timestamptz,jsonb)') IS NOT NULL THEN
   RAISE EXCEPTION 'rollback did not remove RPC';
 END IF;
 RAISE NOTICE 'PASS: disposable function removal completed; other fixture objects preserved';
END $$;
SQLCHECK
[[ "$(pg -Atc 'select count(*) from public.work_board_events')" == 0 ]] || fail 'audit rows changed by rollback'

printf '========== 08 FINAL EVIDENCE ==========\n'
cat > "$EVIDENCE/M144_5-DISPOSABLE-POSTGRES-PASS-NOT-RELEASE-CERTIFIED.txt" <<EOF
M144.5 DISPOSABLE POSTGRESQL MIGRATION/ROLLBACK/SECURITY: PASS
M143 draft SHA-256: b883b3c432ae5ebcadd9fda2f15b5bcdeb0cff9448ace4862c6fb88fd5fd37fc
PostgreSQL: $VERSION
Docker image ID: $IMAGE_ID
Database ingress: NONE (Docker --network none, no host ports)
Source fixture: unchanged; no hosted services used
Real GoTrue/PostgREST/browser: NOT validated by this PostgreSQL-only gate
Staging/production migration: NOT APPLIED
Release certification: WITHHELD
EOF
( cd "$EVIDENCE" && shasum -a 256 M144_5-* > M144_5-ARTIFACTS-SHA256.txt )
COMPLETE=1
echo 'M144.5 DISPOSABLE POSTGRESQL MIGRATION/ROLLBACK/SECURITY: PASS (NOT RELEASE CERTIFIED)'
echo "Evidence: $EVIDENCE"
