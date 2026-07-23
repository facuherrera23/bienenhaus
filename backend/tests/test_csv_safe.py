"""
Tests para _csv_safe — previene CSV injection.
"""
import csv
import io


def _csv_safe(val):
    if val is None:
        return ''
    s = str(val)
    if s and s[0] in ('=', '+', '-', '@', '|'):
        return "'" + s
    return s


CSV_PAYLOADS = [
    '=CMD()',
    '+CMD()',
    '-CMD()',
    '@CMD()',
    '|CMD()',
    '=1+1',
    '+SUM(A1:A10)',
]


class TestCsvSafe:

    def test_normal_strings_unchanged(self):
        assert _csv_safe('hola') == 'hola'
        assert _csv_safe('123') == '123'
        assert _csv_safe('') == ''

    def test_none_returns_empty(self):
        assert _csv_safe(None) == ''

    def test_injection_prefixes_escaped(self):
        for payload in CSV_PAYLOADS:
            assert _csv_safe(payload) == "'" + payload, f'Falló para {payload}'

    def test_csv_writer_applies_escape(self):
        """Verifica que al escribir CSV, los valores maliciosos queden inofensivos."""
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow([_csv_safe('=SUM(A1:A10)')])
        output = buf.getvalue()
        assert "'=SUM(A1:A10)" in output
