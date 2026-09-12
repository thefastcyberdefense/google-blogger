"""Deterministic verifier contracts; execute only in GitHub Actions."""
import copy
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import stat
import struct
import unittest
import warnings
import zipfile
from datetime import datetime, timezone

spec = importlib.util.spec_from_file_location('artifact_verifier', Path(__file__).resolve().parents[2] / 'tools/verify-artifact.py')
v = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v)
NOW = datetime(2026, 9, 12, tzinfo=timezone.utc)
SHA = 'a' * 40
XML = ('<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><head><meta name="theme-build" content="0.1.0+' + SHA + '"/></head><body/></html>').encode()

def evidence():
    return {
        'dist/theme.xml': XML,
        'build-size.json': json.dumps({'source': SHA, 'xml': {'raw': len(XML), 'gzip': 1}, 'css': {'raw': 100}, 'js': {'raw': 200}}).encode(),
        'unit-report.json': json.dumps({'success': True, 'numTotalTests': 1, 'numPassedTests': 1, 'numFailedTests': 0, 'numPendingTests': 0, 'numTodoTests': 0, 'testResults': [{'status': 'passed', 'assertionResults': [{'status': 'passed', 'fullName': 'specimen'}]}]}).encode(),
        'test-results/browser.json': json.dumps({'stats': {'expected': 1, 'unexpected': 0, 'skipped': 0, 'flaky': 0}, 'errors': [], 'suites': [{'specs': [{'ok': True, 'tests': [{'status': 'expected', 'results': [{'status': 'passed', 'retry': 0}]}]}], 'suites': []}]}).encode()
    }

def packed(files):
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, data in files.items():
            z.writestr(name, data)
    return stream.getvalue()

def candidate(blob=None):
    blob = packed(evidence()) if blob is None else blob
    return {'repository': 'thefastcyberdefense/google-blogger', 'repository_id': 1361530973, 'source': SHA, 'run_id': 123, 'attempt': 1, 'job_id': 456, 'workflow_id': 353256068, 'artifact_id': 789, 'artifact_name': 'fcd-evidence-' + SHA, 'archive_sha256': hashlib.sha256(blob).hexdigest(), 'archive_bytes': len(blob), 'xml_bytes': len(XML), 'unit_passed': 1, 'browser_passed': 1, 'expires_at': '2026-09-26T04:28:06Z'}

def metadata(c):
    run = {'id': c['run_id'], 'run_attempt': 1, 'workflow_id': c['workflow_id'], 'head_sha': SHA, 'head_branch': 'main', 'path': '.github/workflows/ci.yml', 'event': 'push', 'status': 'completed', 'conclusion': 'success', 'repository': {'id': c['repository_id'], 'full_name': c['repository']}, 'head_repository': {'id': c['repository_id'], 'full_name': c['repository']}}
    job = {'id': c['job_id'], 'run_id': c['run_id'], 'run_attempt': 1, 'head_sha': SHA, 'head_branch': 'main', 'name': 'verify', 'status': 'completed', 'conclusion': 'success', 'steps': [{'name': name, 'status': 'completed', 'conclusion': 'success'} for name in v.REQUIRED_STEPS]}
    artifact = {'id': c['artifact_id'], 'name': c['artifact_name'], 'size_in_bytes': c['archive_bytes'], 'digest': 'sha256:' + c['archive_sha256'], 'expired': False, 'expires_at': c['expires_at'], 'workflow_run': {'id': c['run_id'], 'repository_id': c['repository_id'], 'head_repository_id': c['repository_id'], 'head_sha': SHA, 'head_branch': 'main'}}
    return run, {'total_count': 1, 'jobs': [job]}, artifact

class MetadataTests(unittest.TestCase):
    def test_positive(self):
        c = candidate(); v.validate_metadata(*metadata(c), c, NOW)

    def test_reject_metadata_mutations(self):
        mutations = [
            ('wrong source', lambda r,j,a: r.update(head_sha='b'*40)),
            ('wrong repository', lambda r,j,a: r['repository'].update(id=2)),
            ('wrong head repository', lambda r,j,a: r['head_repository'].update(full_name='other/repo')),
            ('wrong run', lambda r,j,a: r.update(id=999)),
            ('wrong attempt', lambda r,j,a: r.update(run_attempt=2)),
            ('wrong workflow', lambda r,j,a: r.update(path='other.yml')),
            ('wrong event', lambda r,j,a: r.update(event='pull_request')),
            ('incomplete', lambda r,j,a: r.update(status='in_progress')),
            ('failed', lambda r,j,a: r.update(conclusion='failure')),
            ('wrong job', lambda r,j,a: j['jobs'][0].update(id=999)),
            ('missing job', lambda r,j,a: j.update(jobs=[])),
            ('extra jobs', lambda r,j,a: j.update(total_count=2)),
            ('missing stage', lambda r,j,a: j['jobs'][0]['steps'].pop()),
            ('skipped stage', lambda r,j,a: j['jobs'][0]['steps'][0].update(conclusion='skipped')),
            ('wrong artifact', lambda r,j,a: a.update(id=1)),
            ('wrong association', lambda r,j,a: a['workflow_run'].update(head_sha='b'*40)),
            ('wrong digest', lambda r,j,a: a.update(digest='sha256:'+'0'*64)),
            ('wrong size', lambda r,j,a: a.update(size_in_bytes=1)),
            ('expired flag', lambda r,j,a: a.update(expired=True)),
            ('expired date', lambda r,j,a: a.update(expires_at='2020-01-01T00:00:00Z')),
        ]
        for name, change in mutations:
            with self.subTest(name=name):
                c=candidate(); r,j,a=metadata(c); change(r,j,a)
                with self.assertRaises(v.VerificationError): v.validate_metadata(r,j,a,c,NOW)

class ArchiveTests(unittest.TestCase):
    def test_positive(self):
        blob=packed(evidence()); self.assertEqual(v.inspect_archive(blob,candidate(blob)),evidence())

    def test_digest_mismatch(self):
        blob=packed(evidence()); c=candidate(blob); c['archive_sha256']='0'*64
        with self.assertRaises(v.VerificationError): v.inspect_archive(blob,c)

    def test_missing_file(self):
        files=evidence(); del files['unit-report.json']; blob=packed(files)
        with self.assertRaises(v.VerificationError): v.inspect_archive(blob,candidate(blob))

    def test_unsafe_names(self):
        for name in ['../escape','/absolute','test-results/../../escape','test-results\\escape','C:/escape','test-results//alias','test-results/./alias','script.py']:
            with self.subTest(name=name):
                files=evidence(); files[name]=b'bad'; blob=packed(files)
                with self.assertRaises(v.VerificationError): v.inspect_archive(blob,candidate(blob))

    def test_duplicate(self):
        out=io.BytesIO(packed(evidence()))
        with warnings.catch_warnings():
            warnings.simplefilter('ignore')
            with zipfile.ZipFile(out,'a') as z: z.writestr('dist/theme.xml',XML)
        blob=out.getvalue()
        with self.assertRaises(v.VerificationError): v.inspect_archive(blob,candidate(blob))

    def test_symlink(self):
        out=io.BytesIO(packed(evidence()))
        with zipfile.ZipFile(out,'a') as z:
            info=zipfile.ZipInfo('test-results/link'); info.create_system=3; info.external_attr=(stat.S_IFLNK|0o777)<<16; z.writestr(info,'/tmp/escape')
        blob=out.getvalue()
        with self.assertRaises(v.VerificationError): v.inspect_archive(blob,candidate(blob))

    def test_encrypted_flag(self):
        blob=bytearray(packed(evidence()))
        local=blob.index(b'PK\x03\x04'); central=blob.index(b'PK\x01\x02')
        for offset in [local+6,central+8]: struct.pack_into('<H',blob,offset,struct.unpack_from('<H',blob,offset)[0]|1)
        blob=bytes(blob)
        with self.assertRaises(v.VerificationError): v.inspect_archive(blob,candidate(blob))

    def test_expansion_limit(self):
        from unittest.mock import patch
        blob=packed(evidence())
        with patch.object(v,'MAX_EXPANDED_BYTES',1,create=True):
            with self.assertRaises(v.VerificationError): v.inspect_archive(blob,candidate(blob))

class EvidenceTests(unittest.TestCase):
    def test_positive(self):
        files=evidence(); digest=hashlib.sha256(XML).hexdigest()
        self.assertEqual(v.validate_evidence(files,digest,candidate())['xml_sha256'],digest)

    def test_xml_digest(self):
        with self.assertRaises(v.VerificationError): v.validate_evidence(evidence(),'0'*64,candidate())

    def test_stamp(self):
        files=evidence(); files['dist/theme.xml']=XML.replace(SHA.encode(),b'b'*40)
        with self.assertRaises(v.VerificationError): v.validate_evidence(files,hashlib.sha256(files['dist/theme.xml']).hexdigest(),candidate())

    def test_duplicate_stamp(self):
        files=evidence(); raw=XML.replace(b'</head>',b'<meta name="theme-build" content="0.1.0+'+SHA.encode()+b'"/></head>'); files['dist/theme.xml']=raw; c=candidate();c['xml_bytes']=len(raw)
        with self.assertRaises(v.VerificationError): v.validate_evidence(files,hashlib.sha256(raw).hexdigest(),c)

    def test_report_mutations(self):
        mutations=[
            ('build-size.json',lambda x:x.update(source='b'*40)),
            ('build-size.json',lambda x:x['xml'].update(raw=1)),
            ('unit-report.json',lambda x:x.update(success=False)),
            ('unit-report.json',lambda x:x.update(numFailedTests=1)),
            ('unit-report.json',lambda x:x.update(numPendingTests=1)),
            ('unit-report.json',lambda x:x.update(numPassedTests=0)),
            ('unit-report.json',lambda x:x['testResults'][0]['assertionResults'][0].update(status='failed')),
            ('test-results/browser.json',lambda x:x['stats'].update(skipped=1)),
            ('test-results/browser.json',lambda x:x['stats'].update(unexpected=1)),
            ('test-results/browser.json',lambda x:x['stats'].update(flaky=1)),
            ('test-results/browser.json',lambda x:x.update(errors=[{'message':'error'}])),
            ('test-results/browser.json',lambda x:x['suites'][0]['specs'][0]['tests'][0]['results'][0].update(status='failed')),
            ('test-results/browser.json',lambda x:x.update(suites=[])),
        ]
        for path,change in mutations:
            with self.subTest(path=path,change=change):
                files=evidence(); value=json.loads(files[path]); change(value); files[path]=json.dumps(value).encode()
                with self.assertRaises(v.VerificationError): v.validate_evidence(files,hashlib.sha256(XML).hexdigest(),candidate())

class LogTests(unittest.TestCase):
    def test_checksum(self):
        digest=hashlib.sha256(XML).hexdigest()
        self.assertEqual(v.checksum_from_log('2026-09-12T04:16:48.123Z '+digest+'  dist/theme.xml\n'),digest)
    def test_missing_or_ambiguous(self):
        for text in ['no checksum','a'*64+'  other.xml','2026-09-12T04:16:48Z '+'a'*64+'  dist/theme.xml\n2026-09-12T04:16:48Z '+'b'*64+'  dist/theme.xml\n']:
            with self.subTest(text=text):
                with self.assertRaises(v.VerificationError): v.checksum_from_log(text)

if __name__=='__main__': unittest.main(verbosity=2)
