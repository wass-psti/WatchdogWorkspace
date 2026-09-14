#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXPECTED_NODE="$(tr -d '[:space:]' < "$ROOT/.nvmrc")"
EXPECTED_NPM="$(sed -nE 's/.*"packageManager"[[:space:]]*:[[:space:]]*"npm@([^"]+)".*/\1/p' "$ROOT/package.json" | head -n 1)"

if [[ -z "$EXPECTED_NODE" ]]; then
  echo "Governed toolchain dispatch failed: .nvmrc is empty." >&2
  exit 1
fi
if [[ -z "$EXPECTED_NPM" ]]; then
  echo "Governed toolchain dispatch failed: package.json does not declare packageManager npm@<version>." >&2
  exit 1
fi
if [[ "$#" -eq 0 ]]; then
  echo "Governed toolchain dispatch failed: no command was supplied." >&2
  exit 1
fi

current_node() { node --version 2>/dev/null || true; }
current_npm() { npm --version 2>/dev/null || true; }
versions_match() {
  [[ "$(current_node)" == "v${EXPECTED_NODE}" && "$(current_npm)" == "$EXPECTED_NPM" ]]
}

if ! versions_match; then
  BEFORE_NODE="$(current_node)"
  BEFORE_NPM="$(current_npm)"
  echo "Governed toolchain dispatch: ${BEFORE_NODE:-node-unavailable} / npm ${BEFORE_NPM:-unavailable} -> Node v${EXPECTED_NODE} / npm ${EXPECTED_NPM}"

  # Fast path for standard NVM installations. This works even when the nvm
  # shell function is not loaded in the current terminal.
  DIRECT_NVM_BIN="${HOME:-}/.nvm/versions/node/v${EXPECTED_NODE}/bin"
  if [[ -n "${HOME:-}" && -x "$DIRECT_NVM_BIN/node" && -x "$DIRECT_NVM_BIN/npm" ]]; then
    export PATH="$DIRECT_NVM_BIN:$PATH"
    hash -r
  fi

  if ! versions_match; then
    NVM_CANDIDATES=(
      "${NVM_DIR:-}/nvm.sh"
      "${HOME:-}/.nvm/nvm.sh"
      "/opt/homebrew/opt/nvm/nvm.sh"
      "/usr/local/opt/nvm/nvm.sh"
    )
    NVM_SCRIPT=""
    for candidate in "${NVM_CANDIDATES[@]}"; do
      if [[ -n "$candidate" && -f "$candidate" ]]; then
        NVM_SCRIPT="$candidate"
        break
      fi
    done

    if [[ -z "$NVM_SCRIPT" ]]; then
      echo "Governed toolchain dispatch failed: Node v${EXPECTED_NODE}/npm ${EXPECTED_NPM} are required and NVM could not be located." >&2
      echo "Install NVM or ensure ~/.nvm/versions/node/v${EXPECTED_NODE}/bin exists." >&2
      exit 1
    fi

    # shellcheck source=/dev/null
    source "$NVM_SCRIPT"
    if [[ "$(nvm version "$EXPECTED_NODE")" == "N/A" ]]; then
      echo "Governed Node v${EXPECTED_NODE} is not installed; installing it through NVM..."
      nvm install "$EXPECTED_NODE"
    fi
    nvm use --silent "$EXPECTED_NODE" >/dev/null
    hash -r
  fi
fi

FINAL_NODE="$(current_node)"
FINAL_NPM="$(current_npm)"
if [[ "$FINAL_NODE" != "v${EXPECTED_NODE}" || "$FINAL_NPM" != "$EXPECTED_NPM" ]]; then
  echo "Governed toolchain dispatch failed after switching: expected Node v${EXPECTED_NODE}/npm ${EXPECTED_NPM}, received ${FINAL_NODE:-unavailable}/npm ${FINAL_NPM:-unavailable}." >&2
  exit 1
fi

export WM_GOVERNED_TOOLCHAIN=1
echo "Governed toolchain dispatch: PASS (${FINAL_NODE}, npm ${FINAL_NPM})"
exec "$@"
