"""Test-first contract scaffold. Not a verified artifact handoff implementation."""
import hashlib
import io
import zipfile

class VerificationError(Exception):
    pass

REQUIRED_STEPS = ('Run npm run typecheck', 'Run npm run build', 'Run npm run contract:check', 'Run npm test -- --reporter=default --reporter=json --outputFile=unit-report.json', 'Run npm run test:render', 'Run npm audit --audit-level=moderate', 'Reject stale generated XML except historical build stamp')

def validate_metadata(run, jobs, artifact, candidate, now):
    return None

def inspect_archive(blob, candidate):
    with zipfile.ZipFile(io.BytesIO(blob)) as archive:
        return {name: archive.read(name) for name in archive.namelist()}

def validate_evidence(files, xml_digest, candidate):
    return {'xml_sha256': hashlib.sha256(files['dist/theme.xml']).hexdigest()}

def checksum_from_log(text):
    return '0' * 64

if __name__ == '__main__':
    raise SystemExit('BLOCKED: test-first scaffold; no handoff is produced')
