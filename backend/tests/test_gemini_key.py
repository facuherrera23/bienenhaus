"""
Tests para Gemini API Key: verifica que NO se envía en query string.
"""
import os


def _read_gemini_extractor():
    path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'extraction', 'gemini.py')
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


class TestGeminiApiKeySecurity:

    def test_no_api_key_in_query_string(self):
        content = _read_gemini_extractor()
        assert '?key={api_key}' not in content, 'API key NO debe estar en query string'
        assert '?key=' not in content.replace('X-Goog-Api-Key', ''), 'No debe haber ?key= en URLs'

    def test_uses_x_goog_api_key_header(self):
        content = _read_gemini_extractor()
        assert 'X-Goog-Api-Key' in content, 'Debe usar header X-Goog-Api-Key'
