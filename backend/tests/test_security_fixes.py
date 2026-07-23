"""
Tests para security fixes:
- SEC-01: SSRF en extract-url (vía _validate_url)
- SEC-02: Stored XSS (vía _html_escape)
- SEC-04: Mass assignment (whitelist en update_from_dict)
- SEC-05: Domain validation (vía _validate_url)
"""
from utils import _validate_url, _html_escape, encrypt_value, decrypt_value, SENSITIVE_CONFIG_KEYS
from models import Appraisal, Comparable, Portal


# ═══════════════════════════════════════════════════════════════════════
#  SEC-05 / SEC-01 — Validación de URLs
# ═══════════════════════════════════════════════════════════════════════

class TestValidateUrl:

    def test_valid_mercadolibre(self):
        url, err = _validate_url('https://mercadolibre.com.ar/item/123')
        assert url is not None
        assert err is None

    def test_valid_zonaprop(self):
        url, err = _validate_url('https://www.zonaprop.com.ar/propiedad.html')
        assert url is not None
        assert err is None

    def test_valid_argenprop(self):
        url, err = _validate_url('https://www.argenprop.com/propiedad')
        assert url is not None
        assert err is None

    def test_valid_subdomain(self):
        url, err = _validate_url('https://inmuebles.mercadolibre.com.ar/MLA-123')
        assert url is not None
        assert err is None

    def test_rejects_localhost(self):
        url, err = _validate_url('http://localhost:8080/secret')
        assert url is None
        assert 'bloqueada' in err

    def test_rejects_127_0_0_1(self):
        url, err = _validate_url('http://127.0.0.1/admin')
        assert url is None
        assert 'bloqueada' in err

    def test_rejects_private_ip_10(self):
        url, err = _validate_url('http://10.0.0.1/secret')
        assert url is None
        assert 'bloqueada' in err

    def test_rejects_private_ip_192_168(self):
        url, err = _validate_url('http://192.168.1.1/admin')
        assert url is None
        assert 'bloqueada' in err

    def test_rejects_private_ip_172(self):
        url, err = _validate_url('http://172.16.0.1/test')
        assert url is None
        assert 'bloqueada' in err

    def test_rejects_metadata_cloud(self):
        url, err = _validate_url('http://169.254.169.254/latest/meta-data/')
        assert url is None
        assert 'bloqueada' in err

    def test_rejects_internal_hostname(self):
        url, err = _validate_url('http://db.internal/config')
        assert url is None
        assert 'bloqueada' in err

    def test_rejects_empty_url(self):
        url, err = _validate_url('')
        assert url is None

    def test_rejects_none_url(self):
        url, err = _validate_url(None)
        assert url is None

    def test_rejects_subdomain_bypass(self):
        """Subdominio malicioso con dominio conocido como sufijo NO debe pasar."""
        url, err = _validate_url('https://mercadolibre.com.ar.evil.com/phish')
        assert url is None, 'Subdominio malicioso no debe ser válido'

    def test_rejects_domain_in_path(self):
        """Dominio conocido en el path NO debe ser válido."""
        url, err = _validate_url('https://evil.com/mercadolibre.com.ar')
        assert url is None

    def test_rejects_query_bypass(self):
        url, err = _validate_url('https://evil.com/?domain=mercadolibre.com.ar')
        assert url is None

    def test_rejects_userinfo_bypass(self):
        url, err = _validate_url('https://mercadolibre.com.ar@evil.com/path')
        assert url is None

    def test_rejects_link_local(self):
        url, err = _validate_url('http://169.254.0.1/test')
        assert url is None
        assert 'bloqueada' in err

    def test_accepts_http(self):
        url, err = _validate_url('http://mercadolibre.com.ar/item')
        assert url is not None

    def test_rejects_ipv6_localhost(self):
        url, err = _validate_url('http://[::1]/test')
        assert url is None
        assert 'bloqueada' in err


# ═══════════════════════════════════════════════════════════════════════
#  SEC-02 — HTML Escaping
# ═══════════════════════════════════════════════════════════════════════

class TestHtmlEscape:

    def test_escapes_script_tag(self):
        result = _html_escape('<script>alert("xss")</script>')
        assert '&lt;' in result
        assert '&gt;' in result
        assert '<script>' not in result

    def test_escapes_ampersand(self):
        result = _html_escape('a&b')
        assert result == 'a&amp;b'

    def test_escapes_double_quote(self):
        result = _html_escape('he said "hello"')
        assert '&quot;' in result

    def test_escapes_single_quote(self):
        result = _html_escape("it's fine")
        assert '&#39;' in result

    def test_escapes_event_handler(self):
        result = _html_escape('<img src=x onerror=alert(1)>')
        assert '&lt;' in result
        assert '&gt;' in result

    def test_returns_empty_for_none(self):
        result = _html_escape(None)
        assert result == ''

    def test_preserves_safe_string(self):
        result = _html_escape('Hello, world!')
        assert result == 'Hello, world!'

    def test_escapes_nested_html(self):
        payload = '<div><script>evil()</script></div>'
        result = _html_escape(payload)
        assert '<div>' not in result
        assert '<script>' not in result

    def test_escapes_template_injection(self):
        payload = '{{config}}'
        result = _html_escape(payload)
        assert result == '{{config}}'


# ═══════════════════════════════════════════════════════════════════════
#  SEC-04 — Mass Assignment Protection
# ═══════════════════════════════════════════════════════════════════════

class TestMassAssignmentAppraisal:

    def test_protected_fields_not_writable(self):
        a = Appraisal()
        a.update_from_dict({
            'valor_estimado_usd': 999999,
            'valor_estimado_ars': 888888,
            'valor_estimado_uvas': 777777,
            'precio_m2_promedio': 5000,
            'precio_m2_minimo': 4000,
            'precio_m2_maximo': 6000,
            'dispersion_pct': 10,
            'coeficiente_promedio': 1.5,
            'total_comparables': 99,
        })
        assert a.valor_estimado_usd is None
        assert a.valor_estimado_ars is None
        assert a.valor_estimado_uvas is None
        assert a.precio_m2_promedio is None
        assert a.precio_m2_minimo is None
        assert a.precio_m2_maximo is None
        assert a.dispersion_pct is None
        assert a.coeficiente_promedio is None
        assert a.total_comparables is None or a.total_comparables == 0

    def test_editable_fields_are_writable(self):
        a = Appraisal()
        a.update_from_dict({
            'titulo': 'Test Casa',
            'solicitante': 'Juan Pérez',
            'direccion': 'Av. Siempre Viva 742',
            'superficie_cubierta': 150.0,
            'dormitorios': 3,
            'tipo_propiedad': 'casa',
        })
        assert a.titulo == 'Test Casa'
        assert a.solicitante == 'Juan Pérez'
        assert a.direccion == 'Av. Siempre Viva 742'
        assert a.superficie_cubierta == 150.0
        assert a.dormitorios == 3
        assert a.tipo_propiedad == 'casa'

    def test_id_not_writable(self):
        a = Appraisal()
        a.update_from_dict({'id': 999})
        assert a.id is None or a.id != 999

    def test_created_at_not_writable(self):
        from datetime import datetime
        a = Appraisal()
        a.update_from_dict({'created_at': datetime(2020, 1, 1)})
        assert a.created_at is None or a.created_at.year != 2020


class TestMassAssignmentComparable:

    def test_protected_fields_not_writable(self):
        c = Comparable()
        c.update_from_dict({
            'coeficiente_ajuste': 2.5,
            'valor_m2_ajustado': 9999,
            'valor_ajustado': 88888,
            'precio_por_m2': 5000,
        })
        assert c.coeficiente_ajuste is None or c.coeficiente_ajuste == 1.0
        assert c.valor_m2_ajustado is None
        assert c.valor_ajustado is None
        assert c.precio_por_m2 is None or c.precio_por_m2 == 0

    def test_editable_fields_are_writable(self):
        c = Comparable()
        c.update_from_dict({
            'calle': 'Av. Colón',
            'numero_calle': '1234',
            'barrio': 'Centro',
            'precio_usd': 75000,
            'superficie_cubierta': 100,
            'dormitorios': 2,
            'comp_ubicacion': 'superior',
        })
        assert c.calle == 'Av. Colón'
        assert c.numero_calle == '1234'
        assert c.barrio == 'Centro'
        assert c.precio_usd == 75000
        assert c.dormitorios == 2
        assert c.comp_ubicacion == 'superior'

    def test_appraisal_id_not_writable(self):
        c = Comparable()
        c.update_from_dict({'appraisal_id': 999})
        assert c.appraisal_id is None or c.appraisal_id != 999

    def test_id_not_writable(self):
        c = Comparable()
        c.update_from_dict({'id': 999})
        assert c.id is None or c.id != 999


# ═══════════════════════════════════════════════════════════════════════
#  Cifrado de credenciales en reposo
# ═══════════════════════════════════════════════════════════════════════

class TestEncryption:

    def test_encrypt_decrypt_roundtrip(self):
        plain = 'my-super-secret-token-123'
        encrypted = encrypt_value(plain)
        assert encrypted != plain
        assert encrypted.startswith('gAAAAA')
        decrypted = decrypt_value(encrypted)
        assert decrypted == plain

    def test_encrypt_empty_returns_empty(self):
        assert encrypt_value('') == ''
        assert encrypt_value(None) is None

    def test_decrypt_empty_returns_empty(self):
        assert decrypt_value('') == ''
        assert decrypt_value(None) is None

    def test_decrypt_plaintext_fallback(self):
        """Valores no cifrados (backward compat) se devuelven tal cual."""
        plain = 'my-plain-token'
        result = decrypt_value(plain)
        assert result == plain

    def test_different_keys_produce_different_ciphertext(self):
        """Mismo plaintext produce ciphertext distinto cada vez (Fernet no es deterministico)."""
        plain = 'token-abc'
        e1 = encrypt_value(plain)
        e2 = encrypt_value(plain)
        assert e1 != e2
        assert decrypt_value(e1) == plain
        assert decrypt_value(e2) == plain

    def test_sensitive_keys_set(self):
        assert 'access_token' in SENSITIVE_CONFIG_KEYS
        assert 'refresh_token' in SENSITIVE_CONFIG_KEYS
        assert 'client_secret' in SENSITIVE_CONFIG_KEYS
        assert 'sftp_pass' in SENSITIVE_CONFIG_KEYS

    def test_encrypt_decrypt_long_token(self):
        """Refresh tokens largos típicos de OAuth deben funcionar."""
        long_token = 'v1.abcdef' * 100  # ~800 chars
        encrypted = encrypt_value(long_token)
        assert decrypt_value(encrypted) == long_token


class TestPortalConfigEncryption:

    def test_config_setter_encrypts_sensitive_fields(self, app):
        with app.app_context():
            p = Portal(name='ML', slug='mercadolibre-test-enc', active=True,
                       config_json='{}')
            p.config = {
                'access_token': 'tok-123',
                'refresh_token': 'ref-456',
                'client_secret': 'secret-789',
                'custom_field': 'hello',
            }
            raw = p.config_json
            assert '"tok-123"' not in raw
            assert '"ref-456"' not in raw
            assert '"secret-789"' not in raw
            assert '"hello"' in raw
            assert 'gAAAAA' in raw

    def test_config_getter_decrypts_sensitive_fields(self, app):
        with app.app_context():
            p = Portal(name='ML', slug='mercadolibre-test-dec', active=True,
                       config_json='{}')
            p.config = {'access_token': 'tok-123'}
            cfg = p.config
            assert cfg['access_token'] == 'tok-123'

    def test_config_roundtrip_preserves_all_fields(self, app):
        with app.app_context():
            p = Portal(name='ML', slug='mercadolibre-test-rt', active=True,
                       config_json='{}')
            original = {
                'access_token': 'tok-abc',
                'refresh_token': 'ref-def',
                'client_id': 'app-123',
                'user_id': 1001,
                'listing_type': 'gold',
            }
            p.config = original
            recovered = p.config
            assert recovered['access_token'] == 'tok-abc'
            assert recovered['refresh_token'] == 'ref-def'
            assert recovered['client_id'] == 'app-123'
            assert recovered['user_id'] == 1001
            assert recovered['listing_type'] == 'gold'

    def test_config_backward_compat_plaintext(self, app):
        """Valores sin cifrar en la DB se leen correctamente (backward compat)."""
        with app.app_context():
            import json
            p = Portal(name='ML', slug='mercadolibre-test-bc', active=True,
                       config_json=json.dumps({
                           'access_token': 'plain-token',
                           'refresh_token': 'plain-refresh',
                           'client_id': 'app-123',
                       }))
            cfg = p.config
            assert cfg['access_token'] == 'plain-token'
            assert cfg['refresh_token'] == 'plain-refresh'

    def test_config_migrates_on_write(self, app):
        """Valores legacy se cifran al primer write."""
        with app.app_context():
            import json
            p = Portal(name='ML', slug='mercadolibre-test-mig', active=True,
                       config_json=json.dumps({
                           'access_token': 'legacy-token',
                       }))
            cfg = p.config
            cfg['new_field'] = 'added'
            p.config = cfg
            raw = p.config_json
            assert 'legacy-token' not in raw
            assert 'gAAAAA' in raw
            assert p.config['access_token'] == 'legacy-token'

    def test_config_non_sensitive_untouched(self, app):
        """Campos no sensibles nunca se cifran."""
        with app.app_context():
            p = Portal(name='ML', slug='mercadolibre-test-ns', active=True,
                       config_json='{}')
            p.config = {'site_id': 'MLA', 'user_id': 12345}
            raw = p.config_json
            assert '"MLA"' in raw
            assert 'gAAAAA' not in raw

