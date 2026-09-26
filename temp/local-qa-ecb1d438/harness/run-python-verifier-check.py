import io
import json
import os
import sys
import unittest
import zipfile

checkout_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'checkout'))
evidence_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'evidence'))
sys.path.insert(0, os.path.join(checkout_dir, 'tests', 'artifact'))

import test_verify_artifact as tva

suite = unittest.defaultTestLoader.loadTestsFromModule(tva)
result = unittest.TestResult()
suite.run(result)
first_run = {
    "testsRun": result.testsRun,
    "failures": [{"test": str(t), "traceback": tb} for t, tb in result.failures],
    "errors": [{"test": str(t), "traceback": tb} for t, tb in result.errors],
    "skipped": [{"test": str(t), "reason": r} for t, r in result.skipped],
}
with open(os.path.join(evidence_dir, 'python-verifier-report.json'), 'w', encoding='utf-8') as f:
    json.dump(first_run, f, indent=2)


def packed_raw(files):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        for name, data in files.items():
            info = zipfile.ZipInfo('entry')
            info.filename = name
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, data)
    return buf.getvalue()


tva.packed = packed_raw
suite2 = unittest.defaultTestLoader.loadTestsFromModule(tva)
result2 = unittest.TestResult()
suite2.run(result2)
diag_run = {
    "description": "Supplemental diagnostic run with raw ZipInfo.filename preserving backslashes on Windows without os.sep normalization in test helper packed()",
    "testsRun": result2.testsRun,
    "failures": [{"test": str(t), "traceback": tb} for t, tb in result2.failures],
    "errors": [{"test": str(t), "traceback": tb} for t, tb in result2.errors],
    "skipped": [{"test": str(t), "reason": r} for t, r in result2.skipped],
}
with open(os.path.join(evidence_dir, 'supplemental', 'python-verifier-raw-zipinfo.json'), 'w', encoding='utf-8') as f:
    json.dump(diag_run, f, indent=2)

print(f"Python reports written: first_run failures={len(result.failures)}, diag_run failures={len(result2.failures)}")
