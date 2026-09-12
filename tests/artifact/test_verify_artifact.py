"""Deterministic verifier contracts; execute only in GitHub Actions."""
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import stat
import struct
import unittest
from unittest.mock import patch, Mock
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
        for name, data in files.items(): z.writestr(name, data)
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

    def test_actual_expiry_without_metadata_change(self):
        c=candidate()
        with self.assertRaises(v.VerificationError):
            v.validate_metadata(*metadata(c),c,datetime(2027,1,1,tzinfo=timezone.utc))

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
        blob=packed(evidence())
        with patch.object(v,'MAX_EXPANDED_BYTES',1):
            with self.assertRaises(v.VerificationError): v.inspect_archive(blob,candidate(blob))
    def test_browser_only_limit(self):
        self.assertEqual(v.MAX_BROWSER_REPORT_BYTES,80*1024*1024)
        self.assertEqual(v.MAX_REPORT_BYTES,64*1024*1024)
        with patch.object(v,'MAX_REPORT_BYTES',1024),patch.object(v,'MAX_BROWSER_REPORT_BYTES',1280):
            files=evidence(); files['test-results/browser.json']=b'x'*1280; blob=packed(files)
            self.assertEqual(v.inspect_archive(blob,candidate(blob))['test-results/browser.json'],b'x'*1280)
            files['test-results/browser.json']+=b'x'; blob=packed(files)
            with self.assertRaises(v.VerificationError): v.inspect_archive(blob,candidate(blob))
            for name in ['unit-report.json','build-size.json']:
                with self.subTest(name=name):
                    files=evidence(); files[name]=b'x'*1025; blob=packed(files)
                    with self.assertRaises(v.VerificationError): v.inspect_archive(blob,candidate(blob))
    def test_other_limits_unchanged(self):
        self.assertEqual(v.MAX_ARCHIVE_BYTES,160*1024*1024)
        self.assertEqual(v.MAX_EXPANDED_BYTES,1024*1024*1024)
        self.assertEqual(v.MAX_MEMBER_BYTES,256*1024*1024)
        self.assertEqual(v.MAX_LOG_BYTES,32*1024*1024)
        self.assertEqual(v.MAX_JSON_BYTES,8*1024*1024)
        self.assertEqual(v.MAX_ENTRIES,10000)
        blob=packed(evidence())
        for key in ['MAX_ARCHIVE_BYTES','MAX_MEMBER_BYTES','MAX_ENTRIES']:
            with self.subTest(key=key),patch.object(v,key,1):
                with self.assertRaises(v.VerificationError): v.inspect_archive(blob,candidate(blob))
    def test_crc_corruption_with_matching_archive_digest(self):
        stream=io.BytesIO()
        with zipfile.ZipFile(stream,'w',zipfile.ZIP_STORED) as z:
            for name,raw in evidence().items(): z.writestr(name,raw)
        blob=bytearray(stream.getvalue()); offset=blob.index(XML); blob[offset]^=1; blob=bytes(blob)
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
    def test_strict_json(self):
        for raw in [b'{"key":1,"key":2}',b'{"key":NaN}',b'{"key":Infinity}',b'not json']:
            with self.subTest(raw=raw):
                with self.assertRaises(v.VerificationError): v.strict_json(raw)
    def test_benign_doctype_and_inert_prism_text(self):
        raw=XML.replace(b'?>',b'?><!DOCTYPE html>').replace(b'<body/>',b'<body><script><![CDATA[const sample="<!DOCTYPE html> <!ENTITY inert>";]]></script><!-- <!DOCTYPE html> --></body>')
        files=evidence(); files['dist/theme.xml']=raw
        size=json.loads(files['build-size.json']);size['xml']['raw']=len(raw);files['build-size.json']=json.dumps(size).encode()
        c=candidate();c['xml_bytes']=len(raw);digest=hashlib.sha256(raw).hexdigest()
        self.assertEqual(v.validate_evidence(files,digest,c)['xml_sha256'],digest)
    def test_reject_external_and_internal_dtd(self):
        declarations=[b'<!DOCTYPE html SYSTEM "https://evil.example/external.dtd">',b'<!DOCTYPE html PUBLIC "public-id" "file:///etc/passwd">',b'<!DOCTYPE html [<!ENTITY x "expanded">]>',b'<!DOCTYPE html [<!ENTITY % p SYSTEM "file:///etc/passwd">%p;]>',b'<!DOCTYPE other>',b'<!DOCTYPE html []>']
        for declaration in declarations:
            with self.subTest(declaration=declaration):
                with self.assertRaises(v.VerificationError): v.parse_xml(XML.replace(b'?>',b'?>'+declaration))
    def test_reject_malformed_xml_and_undefined_entities(self):
        for raw in [b'<html>',XML.replace(b'<body/>',b'<body>&unknown;</body>')]:
            with self.subTest(raw=raw):
                with self.assertRaises(v.VerificationError): v.parse_xml(raw)

class LogTests(unittest.TestCase):
    def test_checksum(self):
        digest=hashlib.sha256(XML).hexdigest()
        self.assertEqual(v.checksum_from_log('2026-09-12T04:16:48.123Z '+digest+'  dist/theme.xml\n'),digest)
    def test_missing_or_ambiguous(self):
        for text in ['no checksum','a'*64+'  other.xml','2026-09-12T04:16:48Z '+'a'*64+'  dist/theme.xml\n2026-09-12T04:16:48Z '+'b'*64+'  dist/theme.xml\n']:
            with self.subTest(text=text):
                with self.assertRaises(v.VerificationError): v.checksum_from_log(text)

class Response(io.BytesIO):
    def __init__(self,body=b'',code=200,headers=None):
        super().__init__(body); self.code=code; self.headers=headers or {}

class TransportTests(unittest.TestCase):
    def test_storage_allowlist(self):
        self.assertTrue(v.allowed_download('https://sample.blob.core.windows.net/container/file?sig=example'))
        self.assertTrue(v.allowed_download('https://sample.actions.githubusercontent.com/file'))
        for url in ['http://sample.blob.core.windows.net/file','https://sample.blob.core.windows.net.evil.example/file','https://evil.example/file','https://user:pass@sample.blob.core.windows.net/file','https://sample.blob.core.windows.net:444/file','https://sample.blob.core.windows.net/file#fragment']:
            with self.subTest(url=url): self.assertFalse(v.allowed_download(url))
    def test_auth_not_forwarded_to_storage(self):
        transport=v.Transport('test-token-not-a-secret'); seen=[]
        def opened(request,timeout):
            seen.append({key.lower():value for key,value in request.header_items()})
            if len(seen)==1: return Response(code=302,headers={'Location':'https://sample.blob.core.windows.net/file'})
            return Response(b'abc',headers={'Content-Length':'3'})
        transport.opener=Mock();transport.opener.open.side_effect=opened
        self.assertEqual(transport.download('/actions/artifacts/1/zip',10),b'abc')
        self.assertEqual(seen[0]['authorization'],'Bearer test-token-not-a-secret')
        self.assertNotIn('authorization',seen[1])
        self.assertIsNone(v.NoRedirect().redirect_request(None,None,302,'',{},'https://evil.example'))
    def test_storage_redirect_rejected_before_request(self):
        transport=v.Transport('test');transport.opener=Mock()
        transport.opener.open.return_value=Response(code=302,headers={'Location':'https://evil.example/file'})
        with self.assertRaises(v.VerificationError): transport.download('/actions/artifacts/1/zip',10)
        self.assertEqual(transport.opener.open.call_count,1)
    def test_content_length_and_stream_bounds(self):
        for response in [Response(b'abc',headers={'Content-Length':'2'}),Response(b'abc',headers={'Content-Length':'4'}),Response(b'abc'),Response(code=404)]:
            with self.subTest(response=response):
                with self.assertRaises(v.VerificationError): v.Transport('test').read(response,2)
    def test_deadline_blocks_network(self):
        transport=v.Transport('test');transport.deadline=0;transport.opener=Mock()
        with self.assertRaises(v.VerificationError): transport.request('https://sample.blob.core.windows.net/file')
        transport.opener.open.assert_not_called()
    def test_redirect_count_bounded(self):
        transport=v.Transport('test');transport.opener=Mock()
        transport.opener.open.side_effect=lambda *a,**kw:Response(code=302,headers={'Location':'https://sample.blob.core.windows.net/file'})
        with self.assertRaises(v.VerificationError): transport.download('/actions/artifacts/1/zip',10)
        self.assertEqual(transport.opener.open.call_count,4)

if __name__=='__main__': unittest.main(verbosity=2)
