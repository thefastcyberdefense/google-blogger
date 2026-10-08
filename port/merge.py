#!/usr/bin/env python3
# TEMPORARY (Ledger v1.8.0 port, owner decision 2026-10-08; removed before the
# port is accepted). Three-way merges every src/ file upstream changed between
# two Ledger commits into the FCD version of that file at a fixed FCD commit:
#   ours   = FCD file at merge.json fcdBase (git show, never the working tree)
#   base   = upstream file at upstreamBase (v1.7.0)
#   theirs = upstream file at upstreamTheirs (v1.8.0)
# Conflicts are resolved by merge.json "resolutions" (per file, in order:
# "ours", "theirs", "both" or {"text": ...}); then merge.json "edits" apply
# literal FCD edits ({"old","new","count"}; count defaults to 1, "all" or
# "any"). The result is written to src/. A file with unresolved conflicts is
# left as it is and its numbered conflicts go to port/conflicts/<path>.txt.
# port/merge-report.json lists every file and outcome. Exit 1 when a
# resolution or edit does not match, so nothing half-applied is committed.
import json, os, re, subprocess, sys
from pathlib import Path

up = Path(sys.argv[1])
spec = json.loads(Path('port/merge.json').read_text(encoding='utf-8'))
for key in ('fcdBase', 'upstreamBase', 'upstreamTheirs'):
    assert re.fullmatch('[0-9a-f]{40}', spec[key]), key


def git(*args, cwd=None, ok=(0,)):
    r = subprocess.run(['git', *args], cwd=cwd, capture_output=True)
    if r.returncode not in ok:
        raise SystemExit(f'git {" ".join(args)} failed: {r.stderr.decode(errors="replace")}')
    return r


def show(rev, path, cwd=None):
    r = subprocess.run(['git', 'show', f'{rev}:{path}'], cwd=cwd, capture_output=True)
    return r.stdout if r.returncode == 0 else None


changed = git('diff', '--name-status', spec['upstreamBase'], spec['upstreamTheirs'], '--', 'src', cwd=up).stdout.decode().split('\n')
outside = git('diff', '--name-only', spec['upstreamBase'], spec['upstreamTheirs'], cwd=up).stdout.decode().split()
report = {'fcdBase': spec['fcdBase'], 'upstreamBase': spec['upstreamBase'], 'upstreamTheirs': spec['upstreamTheirs'], 'files': [], 'notInSrc': [p for p in outside if not p.startswith('src/')]}
tmp = Path(os.environ.get('RUNNER_TEMP', '/tmp')) / 'fcd-merge'
tmp.mkdir(parents=True, exist_ok=True)
conflict_dir = Path('port/conflicts')
if conflict_dir.exists():
    for f in sorted(conflict_dir.rglob('*'), reverse=True):
        f.unlink() if f.is_file() else f.rmdir()
failed = []
MARK = re.compile(r'^<<<<<<< fcd\n(.*?)^\|\|\|\|\|\|\| v1\.7\.0\n(.*?)^=======\n(.*?)^>>>>>>> v1\.8\.0\n', re.S | re.M)

for line in changed:
    if not line.strip():
        continue
    status, path = line.split('\t', 1)[0], line.split('\t')[-1]
    entry = {'path': path, 'status': status}
    ours = show(spec['fcdBase'], path)
    base = show(spec['upstreamBase'], path, cwd=up)
    theirs = show(spec['upstreamTheirs'], path, cwd=up)
    if theirs is None:
        entry['outcome'] = 'deleted upstream, kept'
        report['files'].append(entry)
        continue
    if ours is None or base is None:
        merged, conflicts = theirs.decode('utf-8'), 0
        entry['outcome'] = 'added from upstream'
    else:
        for name, data in (('ours', ours), ('base', base), ('theirs', theirs)):
            (tmp / name).write_bytes(data)
        r = subprocess.run(['git', 'merge-file', '-p', '--diff3', '-L', 'fcd', '-L', 'v1.7.0', '-L', 'v1.8.0', str(tmp / 'ours'), str(tmp / 'base'), str(tmp / 'theirs')], capture_output=True)
        if r.returncode < 0 or r.returncode > 127:
            raise SystemExit(f'merge-file failed on {path}: {r.stderr.decode(errors="replace")}')
        merged, conflicts = r.stdout.decode('utf-8'), r.returncode
        entry['conflicts'] = conflicts
    picks = spec.get('resolutions', {}).get(path, [])
    hunks = list(MARK.finditer(merged))
    if hunks and len(picks) != len(hunks):
        entry['outcome'] = f'{len(hunks)} conflicts, {len(picks)} resolutions'
        out = conflict_dir / (path + '.txt')
        out.parent.mkdir(parents=True, exist_ok=True)
        parts = []
        for i, m in enumerate(hunks):
            before = merged[:m.start()].split('\n')[-6:]
            after = merged[m.end():].split('\n')[:5]
            parts.append(f'=== conflict {i} (line {merged[:m.start()].count(chr(10)) + 1}) ===\n--- context before\n' + '\n'.join(before) + f'\n--- fcd\n{m.group(1)}--- v1.7.0\n{m.group(2)}--- v1.8.0\n{m.group(3)}--- context after\n' + '\n'.join(after) + '\n')
        out.write_text('\n'.join(parts), encoding='utf-8')
        report['files'].append(entry)
        continue
    for m, pick in reversed(list(zip(hunks, picks))):
        if pick == 'ours':
            text = m.group(1)
        elif pick == 'theirs':
            text = m.group(3)
        elif pick == 'both':
            text = m.group(1) + m.group(3)
        elif isinstance(pick, dict) and isinstance(pick.get('text'), str):
            text = pick['text']
        else:
            failed.append(f'{path}: bad resolution {pick!r}')
            text = m.group(0)
        merged = merged[:m.start()] + text + merged[m.end():]
    for e in spec.get('edits', {}).get(path, []):
        n = merged.count(e['old'])
        want = e.get('count', 1)
        if (want == 'any' and n == 0) or (isinstance(want, int) and n != want) or (want == 'all' and n == 0):
            failed.append(f'{path}: edit matched {n}x, want {want}: {e["old"][:80]!r}')
            continue
        merged = merged.replace(e['old'], e['new'])
    if '<<<<<<< fcd' in merged or '>>>>>>> v1.8.0' in merged:
        failed.append(f'{path}: conflict markers left after resolutions')
        continue
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(merged, encoding='utf-8')
    entry.setdefault('outcome', 'merged' if not hunks else f'merged, {len(hunks)} conflicts resolved')
    report['files'].append(entry)

for path in spec.get('edits', {}):
    if path not in [f['path'] for f in report['files']]:
        failed.append(f'{path}: edits listed for a file upstream did not change')

report['failed'] = failed
Path('port/merge-report.json').write_text(json.dumps(report, indent=1, ensure_ascii=True) + '\n', encoding='utf-8')
esc = lambda v: str(v).replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
summary = [f"{f['path']}: {f.get('outcome', '?')}" for f in report['files']]
print('::notice title=Merge report::' + esc('\n'.join(summary + ['not in src: ' + ', '.join(report['notInSrc'])]))[:12000])
for f in failed[:10]:
    print('::error title=Merge failure::' + esc(f)[:4000])
sys.exit(1 if failed else 0)
