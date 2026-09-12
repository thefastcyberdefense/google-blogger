"""Read-only, pinned Actions artifact verification. Standard library only.

The CLI runs only in GitHub Actions. Archive members are never extracted or
executed. A handoff is written only after every provenance/content check passes.
"""
import hashlib
import io
import json
import os
from pathlib import Path
import re
import signal
import stat
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
import zipfile
from datetime import datetime, timezone

CANDIDATE = {
    'repository': 'thefastcyberdefense/google-blogger', 'repository_id': 1361530973,
    'source': '9a6f484a2c389c3b256dcd58d88742118fc01905',
    'run_id': 34672572631, 'attempt': 1, 'job_id': 103496602996,
    'workflow_id': 353256068, 'artifact_id': 10291252454,
    'artifact_name': 'fcd-evidence-9a6f484a2c389c3b256dcd58d88742118fc01905',
    'archive_sha256': '1fedb62352c275addd266e83b3955ada49341b176114ea269884e9d0ca2bd069',
    'archive_bytes': 99701644, 'xml_bytes': 95157,
    'unit_passed': 203, 'browser_passed': 1170,
    'expires_at': '2026-09-26T04:28:06Z'
}
# Transport/archive safety bounds, NOT theme component budgets.
MAX_ARCHIVE_BYTES = 160 * 1024 * 1024
MAX_EXPANDED_BYTES = 1024 * 1024 * 1024
MAX_MEMBER_BYTES = 256 * 1024 * 1024
MAX_REPORT_BYTES = 64 * 1024 * 1024
MAX_ENTRIES = 10000
MAX_JSON_BYTES = 8 * 1024 * 1024
MAX_LOG_BYTES = 32 * 1024 * 1024
REQUIRED_FILES = ('dist/theme.xml', 'build-size.json', 'unit-report.json', 'test-results/browser.json')
REQUIRED_STEPS = (
    'Set up job',
    'Run actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
    'Run actions/setup-node@94196ee1d15439c1b6651cd87ef14e88ec435966',
    'Run npm ci --ignore-scripts --no-audit --no-fund',
    'Run npm run typecheck',
    'Run cp dist/theme.xml "$RUNNER_TEMP/checked-in-theme.xml"',
    'Run npm run build',
    'Report size evidence (only total XML capped)',
    'Run npm run contract:check',
    'Run npx --no-install playwright install --with-deps chromium firefox webkit',
    'Run npm test -- --reporter=default --reporter=json --outputFile=unit-report.json',
    'Report regression evidence',
    'Run npm run preview -- --build-only',
    'Run npm run test:render',
    'Report browser counts',
    'Run npm audit --audit-level=moderate',
    'Reject stale generated XML except historical build stamp',
    'Run actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a',
    'Post Run actions/setup-node@94196ee1d15439c1b6651cd87ef14e88ec435966',
    'Post Run actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
    'Complete job'
)

class VerificationError(Exception):
    """Only fixed, non-sensitive messages may be printed by the CLI."""

def require(condition, message):
    if not condition:
        raise VerificationError(message)

def utc(value):
    try:
        result = datetime.fromisoformat(value.replace('Z', '+00:00'))
        require(result.tzinfo is not None, 'timestamp requires timezone')
        return result
    except (ValueError, TypeError, AttributeError):
        raise VerificationError('invalid evidence timestamp') from None

def strict_json(raw):
    def pairs(items):
        result = {}
        for key, value in items:
            require(key not in result, 'duplicate JSON key')
            result[key] = value
        return result
    def invalid(_):
        raise VerificationError('non-finite JSON number')
    try:
        return json.loads(raw, object_pairs_hook=pairs, parse_constant=invalid)
    except (ValueError, UnicodeError, RecursionError):
        raise VerificationError('invalid JSON evidence') from None

def validate_metadata(run, jobs, artifact, candidate, now):
    c = candidate
    for key, expected in {'id': c['run_id'], 'run_attempt': c['attempt'], 'workflow_id': c['workflow_id'], 'head_sha': c['source'], 'head_branch': 'main', 'path': '.github/workflows/ci.yml', 'event': 'push', 'status': 'completed', 'conclusion': 'success'}.items():
        require(run.get(key) == expected, 'generating run mismatch: ' + key)
    for key in ('repository', 'head_repository'):
        repo = run.get(key, {})
        require(repo.get('id') == c['repository_id'] and repo.get('full_name') == c['repository'], 'generating repository mismatch')
    require(jobs.get('total_count') == 1 and len(jobs.get('jobs', [])) == 1, 'generating job inventory mismatch')
    job = jobs['jobs'][0]
    for key, expected in {'id': c['job_id'], 'run_id': c['run_id'], 'run_attempt': c['attempt'], 'head_sha': c['source'], 'head_branch': 'main', 'name': 'verify', 'status': 'completed', 'conclusion': 'success'}.items():
        require(job.get(key) == expected, 'generating job mismatch: ' + key)
    steps = job.get('steps', [])
    require(len(steps) == len(REQUIRED_STEPS) and {s.get('name') for s in steps} == set(REQUIRED_STEPS), 'mandatory stage inventory mismatch')
    require(all(s.get('status') == 'completed' and s.get('conclusion') == 'success' for s in steps), 'mandatory stage did not succeed')
    for key, expected in {'id': c['artifact_id'], 'name': c['artifact_name'], 'size_in_bytes': c['archive_bytes'], 'digest': 'sha256:' + c['archive_sha256'], 'expires_at': c['expires_at']}.items():
        require(artifact.get(key) == expected, 'artifact metadata mismatch: ' + key)
    require(artifact.get('expired') is False and utc(artifact.get('expires_at')) > now, 'artifact expired')
    association = artifact.get('workflow_run', {})
    for key, expected in {'id': c['run_id'], 'repository_id': c['repository_id'], 'head_repository_id': c['repository_id'], 'head_sha': c['source'], 'head_branch': 'main'}.items():
        require(association.get(key) == expected, 'artifact source association mismatch: ' + key)

def inspect_archive(blob, candidate):
    require(len(blob) == candidate['archive_bytes'] and len(blob) <= MAX_ARCHIVE_BYTES, 'archive download size mismatch')
    require(hashlib.sha256(blob).hexdigest() == candidate['archive_sha256'], 'archive checksum mismatch')
    found = {}
    try:
        with zipfile.ZipFile(io.BytesIO(blob)) as archive:
            infos = archive.infolist()
            require(0 < len(infos) <= MAX_ENTRIES, 'archive entry limit exceeded')
            total = 0; seen = set()
            for info in infos:
                name = info.filename
                canonical = name[:-1] if name.endswith('/') else name
                require(name == info.orig_filename and canonical and not name.startswith('/') and '\\' not in name and ':' not in name and not any(ord(ch) < 32 or ord(ch) == 127 for ch in name), 'unsafe archive path')
                require(all(part not in ('', '.', '..') for part in canonical.split('/')), 'unsafe archive path')
                require(canonical.casefold() not in seen, 'duplicate archive entry')
                seen.add(canonical.casefold())
                require(not (info.flag_bits & 1), 'encrypted archive entry')
                mode = stat.S_IFMT(info.external_attr >> 16)
                require(mode in (0, stat.S_IFREG, stat.S_IFDIR), 'special archive entry rejected')
                require(mode != stat.S_IFDIR or info.is_dir(), 'directory metadata mismatch')
                require(mode != stat.S_IFREG or not info.is_dir(), 'file metadata mismatch')
                allowed = name in REQUIRED_FILES or name == 'package-lock.json' or name.startswith(('test-results/', 'playwright-report/')) or name in ('dist/',)
                require(allowed, 'unexpected artifact layout')
                total += info.file_size
                require(0 <= info.file_size <= MAX_MEMBER_BYTES and total <= MAX_EXPANDED_BYTES, 'archive expansion limit exceeded')
                if name in REQUIRED_FILES:
                    limit = 500000 if name == 'dist/theme.xml' else MAX_REPORT_BYTES
                    require(info.file_size <= limit, 'evidence member size exceeded')
            # Stream every member to verify CRC/actual lengths; never extract or execute.
            actual_total = 0
            for info in infos:
                if info.is_dir():
                    require(info.file_size == 0, 'nonempty directory entry')
                    continue
                selected = info.filename in REQUIRED_FILES
                chunks = []; size = 0
                with archive.open(info) as member:
                    while True:
                        chunk = member.read(65536)
                        if not chunk: break
                        size += len(chunk); actual_total += len(chunk)
                        require(size <= info.file_size and actual_total <= MAX_EXPANDED_BYTES, 'actual archive expansion exceeded')
                        if selected: chunks.append(chunk)
                require(size == info.file_size, 'archive member length mismatch')
                if selected: found[info.filename] = b''.join(chunks)
        require(set(found) == set(REQUIRED_FILES), 'required evidence file missing')
        return found
    except VerificationError:
        raise
    except (zipfile.BadZipFile, RuntimeError, NotImplementedError, ValueError, EOFError, OSError):
        raise VerificationError('invalid archive structure or CRC') from None

def checksum_from_log(text):
    # Accept a checksum output line, never a command, notice, or arbitrary substring.
    clean = re.sub(r'\x1b\[[0-9;]*m', '', text)
    matches = re.findall(r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\s+([a-f0-9]{64})\s+\*?dist/theme\.xml\s*$', clean, re.MULTILINE)
    require(len(matches) == 1, 'generating XML checksum missing or ambiguous')
    return matches[0]

def validate_evidence(files, xml_digest, candidate):
    c = candidate
    require(set(REQUIRED_FILES).issubset(files), 'required evidence missing')
    raw = files['dist/theme.xml']
    require(len(raw) == c['xml_bytes'] and len(raw) <= 500000, 'XML size mismatch')
    digest = hashlib.sha256(raw).hexdigest()
    require(re.fullmatch('[a-f0-9]{64}', xml_digest or '') and digest == xml_digest, 'XML checksum differs from generating log')
    require(b'<!doctype' not in raw.lower() and b'<!entity' not in raw.lower(), 'XML DTD/entity declarations rejected')
    try:
        tree = ET.fromstring(raw)
    except ET.ParseError:
        raise VerificationError('invalid XML') from None
    ns = '{http://www.w3.org/1999/xhtml}'
    require(tree.tag == ns + 'html', 'unexpected XML root')
    stamps = [el for el in tree.iter(ns + 'meta') if el.get('name') == 'theme-build']
    require(len(stamps) == 1 and stamps[0] in list(tree.find(ns + 'head')) and stamps[0].get('content') == '0.1.0+' + c['source'], 'XML build stamp mismatch')
    size = strict_json(files['build-size.json'])
    require(size.get('source') == c['source'] and size.get('xml', {}).get('raw') == len(raw), 'build-size report mismatch')
    unit = strict_json(files['unit-report.json'])
    expected_unit = {'numTotalTests': c['unit_passed'], 'numPassedTests': c['unit_passed'], 'numFailedTests': 0, 'numPendingTests': 0}
    require(unit.get('success') is True and all(type(unit.get(k)) is int and unit[k] == value for k, value in expected_unit.items()) and unit.get('numTodoTests', 0) == 0, 'unit report totals failed')
    suites = unit.get('testResults', [])
    assertions = [a for suite in suites for a in suite.get('assertionResults', [])]
    require(suites and all(s.get('status') == 'passed' for s in suites) and len(assertions) == c['unit_passed'] and all(a.get('status') == 'passed' for a in assertions), 'unit assertions failed or incomplete')
    browser = strict_json(files['test-results/browser.json'])
    stats = browser.get('stats', {})
    require(all(type(stats.get(k)) is int and stats[k] == value for k, value in {'expected': c['browser_passed'], 'unexpected': 0, 'skipped': 0, 'flaky': 0}.items()) and not browser.get('errors'), 'browser report totals failed')
    pending = [(s, 0) for s in browser.get('suites', [])]; tests = []; nodes = 0
    while pending:
        suite, depth = pending.pop(); nodes += 1
        require(depth <= 32 and nodes <= 20000, 'browser report traversal limit exceeded')
        pending.extend((child, depth + 1) for child in suite.get('suites', []))
        for spec in suite.get('specs', []):
            require(spec.get('ok') is True, 'browser specification failed')
            tests.extend(spec.get('tests', []))
            require(len(tests) <= c['browser_passed'], 'unexpected browser test count')
    require(len(tests) == c['browser_passed'], 'browser tests missing')
    for test in tests:
        results = test.get('results', [])
        require(test.get('status') == 'expected' and len(results) == 1 and results[0].get('status') == 'passed' and results[0].get('retry') == 0 and not results[0].get('errors') and not results[0].get('error'), 'browser result failed, retried or incomplete')
    return {'xml_sha256': digest, 'xml_bytes': len(raw), 'build_stamp': stamps[0].get('content'), 'unit_passed': len(assertions), 'browser_passed': len(tests), 'component_sizes_informational': {'css': size.get('css'), 'js': size.get('js')}}

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def allowed_download(url):
    try:
        parsed = urllib.parse.urlsplit(url)
        host = parsed.hostname or ''
        return parsed.scheme == 'https' and parsed.port in (None, 443) and not parsed.username and not parsed.password and not parsed.fragment and not any(ord(ch) <= 32 or ord(ch) == 127 for ch in url) and (host.endswith('.blob.core.windows.net') or host.endswith('.actions.githubusercontent.com'))
    except ValueError:
        return False

class Transport:
    def __init__(self, token):
        self.token = token
        self.opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
        self.deadline = time.monotonic() + 300

    def request(self, url, authenticated=False):
        if authenticated:
            require(url.startswith('https://api.github.com/repos/' + CANDIDATE['repository'] + '/'), 'unexpected authenticated API destination')
        else:
            require(allowed_download(url), 'unapproved storage destination')
        headers = {'User-Agent': 'fcd-artifact-verifier', 'Accept-Encoding': 'identity'}
        if authenticated:
            headers.update({'Authorization': 'Bearer ' + self.token, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'})
        require(time.monotonic() < self.deadline, 'transport deadline exceeded')
        try:
            return self.opener.open(urllib.request.Request(url, headers=headers, method='GET'), timeout=min(30, max(1, self.deadline-time.monotonic())))
        except urllib.error.HTTPError as error:
            if error.code in (301,302,303,307,308): return error
            raise VerificationError('GitHub/download request failed; no fallback candidate') from None
        except (urllib.error.URLError, TimeoutError, OSError):
            raise VerificationError('transport unavailable or timed out') from None

    def read(self, response, limit):
        with response:
            require(response.code == 200, 'unexpected download status')
            length = response.headers.get('Content-Length')
            if length is not None:
                require(length.isdigit() and int(length) <= limit, 'response content length exceeded')
            chunks = []; count = 0
            while True:
                require(time.monotonic() < self.deadline, 'transport deadline exceeded')
                chunk = response.read(65536)
                if not chunk: break
                count += len(chunk)
                require(count <= limit, 'response byte limit exceeded')
                chunks.append(chunk)
            if length is not None: require(count == int(length), 'response truncated')
            return b''.join(chunks)

    def api(self, path):
        url = 'https://api.github.com/repos/' + CANDIDATE['repository'] + path
        return strict_json(self.read(self.request(url, True), MAX_JSON_BYTES))

    def download(self, path, limit):
        url = 'https://api.github.com/repos/' + CANDIDATE['repository'] + path
        response = self.request(url, True)
        with response:
            require(response.code == 302, 'expected GitHub download redirect')
            location = response.headers.get('Location', '')
        # Separate unauthenticated requests: never forward Authorization to storage.
        for _ in range(3):
            response = self.request(location, False)
            if response.code == 200: return self.read(response, limit)
            with response:
                require(response.code in (301,302,303,307,308), 'invalid storage redirect')
                location = response.headers.get('Location', '')
        raise VerificationError('storage redirect limit exceeded')

def main():
    require(os.environ.get('GITHUB_ACTIONS') == 'true', 'execute this verifier only in GitHub Actions')
    verifier_sha = os.environ.get('VERIFIER_SHA', '')
    require(re.fullmatch('[a-f0-9]{40}', verifier_sha), 'full verifier revision required')
    token = os.environ.get('GH_TOKEN', '')
    require(bool(token), 'Actions read token required')
    c = CANDIDATE
    transport = Transport(token)
    run = transport.api(f"/actions/runs/{c['run_id']}/attempts/{c['attempt']}")
    jobs = transport.api(f"/actions/runs/{c['run_id']}/attempts/{c['attempt']}/jobs?per_page=100")
    artifact = transport.api(f"/actions/artifacts/{c['artifact_id']}")
    validate_metadata(run, jobs, artifact, c, datetime.now(timezone.utc))
    print('PASS: pinned repository, source, run attempt, mandatory stages and artifact metadata')
    log = transport.download(f"/actions/jobs/{c['job_id']}/logs", MAX_LOG_BYTES).decode('utf-8')
    xml_digest = checksum_from_log(log)
    print('PASS: unique generating-job XML checksum located')
    blob = transport.download(f"/actions/artifacts/{c['artifact_id']}/zip", MAX_ARCHIVE_BYTES)
    files = inspect_archive(blob, c)
    print('PASS: archive digest, paths, entry types, byte bounds and CRCs')
    evidence = validate_evidence(files, xml_digest, c)
    # Recheck expiry/association before producing a handoff.
    validate_metadata(run, jobs, transport.api(f"/actions/artifacts/{c['artifact_id']}"), c, datetime.now(timezone.utc))
    report = {'status': 'verified', 'verified_at': datetime.now(timezone.utc).isoformat(), 'verifier_revision': verifier_sha, 'verification_run': os.environ.get('GITHUB_RUN_ID'), 'candidate': c, 'generating_run_url': f"https://github.com/{c['repository']}/actions/runs/{c['run_id']}", 'evidence': evidence, 'limits': {'archive_bytes': MAX_ARCHIVE_BYTES, 'expanded_bytes': MAX_EXPANDED_BYTES, 'entry_count': MAX_ENTRIES, 'report_bytes': MAX_REPORT_BYTES, 'theme_xml_bytes': 500000}, 'limitations': ['Not a signed build attestation', 'No Blogger import/save or native compatibility validation', 'No human accessibility or field performance approval', 'XML copied byte-for-byte; not regenerated']}
    out = Path('verified-handoff')
    out.mkdir(exist_ok=False)
    (out/'theme.xml').write_bytes(files['dist/theme.xml'])
    (out/'theme.xml.sha256').write_text(evidence['xml_sha256']+'  theme.xml\n', encoding='utf-8')
    (out/'verification.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
    print('::notice title=Verified XML::sha256='+evidence['xml_sha256']+'; bytes='+str(evidence['xml_bytes'])+'; unit='+str(evidence['unit_passed'])+'; browser='+str(evidence['browser_passed']))
    print('PASS: verified handoff prepared; import and release remain unauthorized')

if __name__ == '__main__':
    def expired(signum, frame):
        raise VerificationError('whole-process time limit exceeded')
    signal.signal(signal.SIGALRM, expired)
    signal.alarm(330)
    try:
        main()
    except VerificationError as error:
        print('::error title=Artifact verification blocked::'+str(error))
        sys.exit(1)
    except Exception:
        # Never expose tokens, signed URLs, raw HTTP errors or untrusted content.
        print('::error title=Artifact verification blocked::unexpected evidence or transport structure; no handoff approved')
        sys.exit(1)
