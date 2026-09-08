"""Static Blogger contracts only. Passing does not prove Blogger import/rendering."""
from pathlib import Path
import xml.etree.ElementTree as ET
xml = Path('dist/theme.xml').read_bytes()
assert len(xml) <= 500000, 'theme size budget'
root = ET.fromstring(xml)
b = '{http://www.google.com/2005/gml/b}'
assert root.get(b+'layoutsVersion') == '3'
assert root.get(b+'defaultwidgetversion') == '2'
widgets = root.findall('.//'+b+'widget')
assert widgets and all(w.get('version') == '2' for w in widgets)
assert len({w.get('id') for w in widgets}) == len(widgets), 'duplicate widgets'
assert any(w.get('id') == 'Blog1' and w.get('type') == 'Blog' for w in widgets)
assert any(w.get('id') == 'Header1' and w.get('type') == 'Header' for w in widgets)
for section in root.findall('.//'+b+'section'):
    assert all(c.tag == b+'widget' for c in section), 'section has non-widget child'
assert root.findall('.//'+b+'defaultmarkup')
assert any(i.get('name') == 'super.main' for i in root.findall('.//'+b+'include'))
assert b'data:blog.pageType' not in xml
assert b'ledger_recent_posts' not in xml
print('PASS: XML parsing, size, V3/V2, section/widget and native-dispatch contracts. Blogger import still pending.')
