#!/usr/bin/env python3
"""FCD Ledger port applier (temporary; feature branch only).

Rebuilds every Ledger-derived path from the pinned upstream checkout plus the
reviewed edits in port/ledger.json, so the result is always a pure function of
(upstream commit, manifest). Paths listed in fcdOwned are FCD files that the
port never overwrites. Workflows (.github) are never touched.
"""
import json
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path.cwd()
UPSTREAM = pathlib.Path(sys.argv[1]).resolve()
MANIFEST = json.loads((ROOT / 'port/ledger.json').read_text(encoding='utf-8'))


def fail(message):
    raise SystemExit('PORT_ERROR: ' + message)


def safe(rel):
    parts = pathlib.PurePosixPath(rel).parts
    if not rel or rel.startswith('/') or '..' in parts or parts[0] in ('.github', '.git', 'port'):
        fail('unsafe path ' + repr(rel))
    return rel


head = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=UPSTREAM, check=True, capture_output=True, text=True).stdout.strip()
if head != MANIFEST['upstream']['commit']:
    fail('upstream checkout is ' + head + ', manifest pins ' + MANIFEST['upstream']['commit'])

owned = {safe(p) for p in MANIFEST.get('fcdOwned', [])}

for rel in MANIFEST.get('remove', []):
    target = ROOT / safe(rel)
    if target.is_dir():
        shutil.rmtree(target)
    elif target.exists():
        target.unlink()

imported = []
for rel in MANIFEST['import']:
    source = UPSTREAM / safe(rel)
    if source.is_file():
        files = [source]
    elif source.is_dir():
        files = sorted(f for f in source.rglob('*') if f.is_file())
        upstream_rel = {f.relative_to(UPSTREAM).as_posix() for f in files}
        local = ROOT / rel
        if local.is_dir():
            for f in sorted(local.rglob('*')):
                r = f.relative_to(ROOT).as_posix()
                if f.is_file() and r not in upstream_rel and r not in owned:
                    f.unlink()
    else:
        fail('missing upstream path ' + rel)
    for f in files:
        r = f.relative_to(UPSTREAM).as_posix()
        if r in owned:
            continue
        destination = ROOT / r
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(f, destination)
        imported.append(r)

for r in imported:
    if (ROOT / r).read_bytes() != (UPSTREAM / r).read_bytes():
        fail('import not byte-exact: ' + r)

edited = set()
for number, edit in enumerate(MANIFEST.get('edits', []), 1):
    r = edit['path']
    if r not in imported:
        fail('edit %d targets a non-imported path %s' % (number, r))
    target = ROOT / r
    text = target.read_text(encoding='utf-8')
    expected = edit.get('count', 1)
    found = text.count(edit['find'])
    if found != expected:
        fail('edit %d (%s) matched %d times, expected %d: %r' % (number, r, found, expected, edit['find'][:80]))
    target.write_text(text.replace(edit['find'], edit['replace']), encoding='utf-8')
    edited.add(r)

for r in sorted(owned):
    if not (ROOT / r).is_file():
        fail('FCD-owned file missing: ' + r)

for directory in sorted((p for p in ROOT.rglob('*') if p.is_dir() and '.git' not in p.parts), key=lambda p: len(p.parts), reverse=True):
    if not any(directory.iterdir()):
        directory.rmdir()

print(json.dumps({'upstream': head, 'imported': len(imported), 'verbatim': len(imported) - len(edited), 'edited': sorted(edited), 'edits': len(MANIFEST.get('edits', [])), 'owned': sorted(owned), 'removed': MANIFEST.get('remove', [])}, indent=1))
