"""
Tests para calcular_homologacion y _recalcular.
Importa la función real desde routes.appraisals.
"""
from unittest.mock import MagicMock

FACTOR_MAP = {
    'comp_ubicacion': 0.07,
    'comp_estado_mantenimiento': 0.05,
    'comp_antiguedad': 0.05,
    'comp_habitaciones': 0.04,
    'comp_estacionamiento': 0.03,
    'comp_comodidades': 0.04,
}

# La importación es diferida para no capturar csrf_protect original
# antes de que el monkeypatch en conftest aplique el bypass.
_calcular_homologacion = None


def _get_calcular_homologacion():
    global _calcular_homologacion
    if _calcular_homologacion is None:
        from services.appraisal_service import AppraisalService
        ch = AppraisalService.calcular_homologacion
        _calcular_homologacion = ch
    return _calcular_homologacion


def _make_comparable(**kwargs):
    """Crea un mock de Comparable con atributos seteables."""
    c = MagicMock()
    c.superficie_cubierta = kwargs.get('superficie_cubierta', 100.0)
    c.precio_usd = kwargs.get('precio_usd', 50000.0)
    c.precio_por_m2 = kwargs.get('precio_por_m2', None)
    c.coeficiente_ajuste = kwargs.get('coeficiente_ajuste', None)
    c.valor_m2_ajustado = kwargs.get('valor_m2_ajustado', None)
    c.valor_ajustado = kwargs.get('valor_ajustado', None)
    for attr in FACTOR_MAP:
        setattr(c, attr, kwargs.get(attr, 'equivalente'))
    return c


class TestCalcularHomologacion:

    def test_normal_case(self):
        c = _make_comparable(superficie_cubierta=100, precio_usd=50000)
        result = _get_calcular_homologacion()(c)
        assert result is not None
        assert result['coeficiente_ajuste'] > 0
        assert result['valor_m2_ajustado'] > 0
        assert result['valor_ajustado'] > 0
        assert c.precio_por_m2 == 500.0

    def test_superficie_cero(self):
        c = _make_comparable(superficie_cubierta=0, precio_usd=50000)
        result = _get_calcular_homologacion()(c)
        assert result is None
        assert c.precio_por_m2 is None
        assert c.coeficiente_ajuste is None

    def test_precio_cero(self):
        c = _make_comparable(superficie_cubierta=100, precio_usd=0)
        result = _get_calcular_homologacion()(c)
        assert result is None
        assert c.precio_por_m2 is None

    def test_superficie_negativa(self):
        c = _make_comparable(superficie_cubierta=-50, precio_usd=50000)
        result = _get_calcular_homologacion()(c)
        assert result is None
        assert c.precio_por_m2 is None

    def test_precio_negativo(self):
        c = _make_comparable(superficie_cubierta=100, precio_usd=-100)
        result = _get_calcular_homologacion()(c)
        assert result is None

    def test_superficie_none(self):
        c = _make_comparable(superficie_cubierta=None, precio_usd=50000)
        result = _get_calcular_homologacion()(c)
        assert result is None

    def test_precio_none(self):
        c = _make_comparable(superficie_cubierta=100, precio_usd=None)
        result = _get_calcular_homologacion()(c)
        assert result is None

    def test_atributos_ajuste(self):
        c = _make_comparable(
            superficie_cubierta=100,
            precio_usd=50000,
            comp_ubicacion='superior',
            comp_antiguedad='inferior',
            comp_estado_mantenimiento='superior',
        )
        result = _get_calcular_homologacion()(c)
        assert result is not None
        coef = result['coeficiente_ajuste']
        assert 0.70 <= coef <= 1.30
        assert c.precio_por_m2 == 500.0
