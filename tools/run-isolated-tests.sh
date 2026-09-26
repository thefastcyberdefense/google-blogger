#!/usr/bin/env bash
# Actions-only accidental-egress boundary, not a hostile-code sandbox.
set -euo pipefail
[[ ${GITHUB_ACTIONS:-} == true && $EUID -ne 0 ]] || { echo 'Actions non-root caller required' >&2; exit 78; }
cd "$(git rev-parse --show-toplevel)"
source_sha=$(git rev-parse HEAD)
node_bin=$(command -v node)
uid=$(id -u); gid=$(id -g)
probe="$PWD/tests/isolation/egress-probe.mjs"

# Only reviewed setup runs privileged. The harness has no network interfaces
# except loopback; payloads run as the original non-root user. PID namespaces
# destroy remaining descendants when their init process exits.
namespace() {
  local mode=$1 seconds=$2 label=$3; shift 3
  local parent_ns; parent_ns=$(readlink /proc/self/ns/net)
  timeout --signal=TERM --kill-after=5s "${seconds}s" sudo -n /usr/bin/unshare --net --pid --fork --kill-child=KILL --mount-proc /bin/bash -ceu '
    mode=$1; uid=$2; gid=$3; parent=$4; node=$5; probe=$6; path=$7; home=$8; evidence=$9; source=${10}; label=${11}; shift 11
    [[ $(readlink /proc/self/ns/net) != "$parent" ]]
    ip link set lo up
    args=(--reuid="$uid" --regid="$gid" --clear-groups)
    if [[ $mode == exec ]]; then
      args+=(--no-new-privs --bounding-set=-all --inh-caps=-all --ambient-caps=-all)
    fi
    exec /usr/bin/setpriv "${args[@]}" /usr/bin/env -i PATH="$path" HOME="$home" LANG=C.UTF-8 CI=true GITHUB_ACTIONS=true FCD_PARENT_NS="$parent" FCD_ISOLATION_EVIDENCE="$evidence" FCD_SOURCE="$source" FCD_LABEL="$label" "$node" "$probe" "$mode" "$@"
  ' fcd-isolation "$mode" "$uid" "$gid" "$parent_ns" "$node_bin" "$probe" "$PATH" "$HOME" "${FCD_ISOLATION_EVIDENCE:?}" "$source_sha" "$label" "$@"
}

receipt_and_exit() {
  local label=$1 result=$2 receipt_result=0
  FCD_SOURCE=$source_sha "$node_bin" "$probe" receipt "$label" "$result" || receipt_result=$?
  # Evidence errors fail successful runs, but never replace the original failure.
  if [[ $result -ne 0 ]]; then exit "$result"; fi
  exit "$receipt_result"
}

case ${1:-} in
  self-test)
    # A job-scoped path is available to this step and all later steps. Never
    # reuse an existing directory, including a stale rerun's evidence.
    mkdir -m 700 "${FCD_ISOLATION_EVIDENCE:?}"
    set +e
    namespace suite 120 bootstrap
    result=$?
    set -e
    receipt_and_exit bootstrap "$result"
    ;;
  run)
    label=${2:-}; seconds=${3:-}; shift 3
    [[ $label =~ ^[a-z][a-z0-9-]{0,40}$ && $seconds =~ ^[1-9][0-9]{0,3}$ && $seconds -le 1200 && $# -gt 0 ]] || exit 78
    [[ -d ${FCD_ISOLATION_EVIDENCE:?} ]] || exit 78
    set +e
    namespace exec "$seconds" "$label" "$@"
    result=$?
    set -e
    receipt_and_exit "$label" "$result"
    ;;
  finalize)
    FCD_SOURCE=$source_sha "$node_bin" "$probe" finalize
    ;;
  *) echo 'Usage: self-test | run LABEL SECONDS COMMAND... | finalize' >&2; exit 78 ;;
esac
