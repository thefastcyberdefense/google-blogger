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
# except loopback; payloads run as the original non-root user.
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

case ${1:-} in
  self-test)
    export FCD_ISOLATION_EVIDENCE
    FCD_ISOLATION_EVIDENCE=$(mktemp -d "${RUNNER_TEMP:?}/fcd-isolation.XXXXXX")
    printf 'FCD_ISOLATION_EVIDENCE=%s\n' "$FCD_ISOLATION_EVIDENCE" >> "${GITHUB_ENV:?}"
    set +e
    namespace suite 120 bootstrap
    result=$?
    set -e
    FCD_SOURCE=$source_sha "$node_bin" "$probe" receipt bootstrap "$result"
    exit "$result"
    ;;
  run)
    label=${2:-}; seconds=${3:-}; shift 3
    [[ $label =~ ^[a-z][a-z0-9-]{0,40}$ && $seconds =~ ^[1-9][0-9]{0,3}$ && $seconds -le 1200 && $# -gt 0 ]] || exit 78
    # Test-first checkpoint: model the old direct-execution behavior only inside
    # the protected harness. Actual application test invocations fail closed.
    [[ ${FCD_HARNESS_NS:-} == "$(readlink /proc/self/ns/net)" && ${FCD_PARENT_NS:-} != "$FCD_HARNESS_NS" ]] || exit 78
    exec "$@"
    ;;
  finalize)
    FCD_SOURCE=$source_sha "$node_bin" "$probe" finalize
    ;;
  *) echo 'Usage: self-test | run LABEL SECONDS COMMAND... | finalize' >&2; exit 78 ;;
esac
