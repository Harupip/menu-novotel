import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

with zipfile.ZipFile(Path(__file__).resolve().parents[1] / 'dist/menu-template.xlsx') as archive:
    ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    sheet = ET.fromstring(archive.read('xl/worksheets/sheet1.xml'))
    styles = ET.fromstring(archive.read('xl/styles.xml')).find('m:cellXfs', ns)
    cells = {cell.attrib['r']: cell for cell in sheet.findall('.//m:c', ns)}
    def unlocked(address):
        protection = styles[int(cells[address].attrib.get('s', 0))].find('m:protection', ns)
        return protection is not None and protection.attrib.get('locked') == '0'
    assert not unlocked('A1') and not unlocked('A4')
    assert all(unlocked(address) for address in ['A5', 'B5', 'C5', 'D5', 'E504'])
    assert sheet.find('m:sheetProtection', ns).attrib['sheet'] == '1'
    assert sheet.find('.//m:pane', ns).attrib['ySplit'] == '4'
print('PASS: Excel template protection and freeze panes')
