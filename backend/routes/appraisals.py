from typing import Any
from datetime import date, datetime
from sqlalchemy.orm import load_only
from flask import Blueprint, request, jsonify, render_template_string, g, session
from extensions import db, limiter
from models import Appraisal, AppraisalVersion, Comparable, AppraisalLog, AppraisalComment, AppraisalFile, AppraisalTimeline
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR
from services import AppraisalService
from services.appraisal_service import FACTOR_MAP, parse_date, geocode
from utils import _ok, _err, _html_escape
from .appraisal_handlers import handle_appraisal

bp = Blueprint('appraisals', __name__, url_prefix='/api/appraisals')


# ── CRUD unificado ──────────────────────────────────────────────
bp.add_url_rule(
    '/<int:tid>',
    view_func=handle_appraisal,
    defaults={'tipo': 'acm'},
    methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    endpoint='appraisal_detail'
)


@bp.route('/extract-url', methods=['POST'])
@limiter.limit("15 per minute")
@csrf_protect
@require_role(ROLE_EDITOR)
def extract_url():
    data = request.get_json(silent=True) or {}
    url = data.get('url', '').strip()
    if not url:
        return _err('Ingresá una URL.')
    result = AppraisalService.extract_url(url)
    if '_error' in result and result['_error']:
        return _ok(result)
    return _ok(result)


@bp.route('/scraper-stats', methods=['GET'])
@require_role(ROLE_EDITOR)
def scraper_stats():
    from scrapers.metrics import get_stats as get_scraper_stats
    return _ok(get_scraper_stats())


@bp.route('/<int:aid>/map-data', methods=['GET'])
@require_role(ROLE_EDITOR)
def appraisal_map_data(aid):
    appraisal = AppraisalService.get_by_id_or_404(aid)
    addr_parts = [p for p in [appraisal.direccion, appraisal.barrio, appraisal.localidad] if p]
    appraisal_addr = ', '.join(addr_parts) if addr_parts else None
    alat, alng = geocode(appraisal_addr) if appraisal_addr else (None, None)

    comps = []
    for c in appraisal.comparables:
        parts = [p for p in [c.calle, c.numero_calle, c.barrio, c.localidad] if p]
        addr = ', '.join(parts) if parts else None
        lat, lng = geocode(addr) if addr else (None, None)
        homolog = AppraisalService.calcular_homologacion(c) or {}
        comps.append({
            'id': c.id, 'numero': c.numero, 'direccion': addr,
            'precio_usd': c.precio_usd, 'precio_ars': c.precio_ars,
            'sup_cubierta': c.superficie_cubierta, 'sup_terreno': c.superficie_terreno,
            'dormitorios': c.dormitorios, 'banios': c.banios,
            'tipo_operacion': c.tipo_operacion, 'tipo_propiedad': c.tipo_propiedad,
            'coeficiente_ajuste': homolog.get('coeficiente_ajuste'),
            'valor_m2_ajustado': homolog.get('valor_m2_ajustado'),
            'valor_ajustado': homolog.get('valor_ajustado'),
            'precio_por_m2': c.precio_por_m2,
            'lat': lat, 'lng': lng,
        })

    return _ok({
        'appraisal': {
            'id': appraisal.id,
            'titulo': appraisal.titulo or appraisal.solicitante,
            'direccion': appraisal_addr,
            'superficie_cubierta': appraisal.superficie_cubierta,
            'superficie_terreno': appraisal.superficie_terreno,
            'tipo_propiedad': appraisal.tipo_propiedad,
            'valor_estimado_usd': appraisal.valor_estimado_usd,
            'precio_m2_promedio': appraisal.precio_m2_promedio,
            'coeficiente_promedio': appraisal.coeficiente_promedio,
            'lat': alat, 'lng': alng,
        },
        'comparables': comps,
    })


@bp.route('', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_appraisals():
    estado = request.args.get('estado', '')
    incluir_archivadas = request.args.get('archivadas', '') == '1'
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '').strip()
    return _ok(AppraisalService.list_appraisals(
        estado=estado, incluir_archivadas=incluir_archivadas,
        page=page, per_page=per_page, search=search,
    ))


@bp.route('', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_appraisal():
    data = request.get_json(silent=True) or {}
    try:
        appraisal = AppraisalService.create(data)
        return _ok(appraisal.to_dict(), 201)
    except ValueError as e:
        return _err(str(e))


@bp.route('/from-request/<int:rid>', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_from_request(rid):
    try:
        result = AppraisalService.create_from_request(rid)
        status = 201 if not result.get('existing') else 200
        return _ok(result, status)
    except ValueError as e:
        return _err(str(e), 500)


@bp.route('/<int:aid>', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_appraisal(aid):
    appraisal = AppraisalService.get_by_id_and_tipo(aid, 'acm')
    return _ok(appraisal.to_dict())


@bp.route('/<int:aid>/pdf', methods=['GET'])
@require_role(ROLE_EDITOR)
def download_appraisal_pdf(aid):
    appraisal = AppraisalService.get_by_id_and_tipo(aid, 'acm')
    from scripts.appraisal_pdf import build_pdf
    pdf_bytes = build_pdf(appraisal)
    filename = f'tasacion_{appraisal.id}_{appraisal.titulo or "informe"}.pdf'
    filename = ''.join(c if c.isalnum() or c in ('-', '_', '.') else '_' for c in filename)
    return pdf_bytes, 200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': f'attachment; filename="{filename}"',
    }


@bp.route('/<int:aid>', methods=['PUT'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_appraisal(aid):
    data = request.get_json(silent=True) or {}
    try:
        appraisal = AppraisalService.update(aid, data, tipo='acm')
        return _ok(appraisal.to_dict())
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:aid>/calculate', methods=['GET'])
@require_role(ROLE_EDITOR)
def calculate_appraisal(aid):
    appraisal = AppraisalService.get_by_id_and_tipo(aid, 'acm')
    AppraisalService.recalcular(appraisal)
    db.session.commit()
    return _ok(appraisal.to_dict())


@bp.route('/<int:aid>/archive', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def archive_appraisal(aid):
    appraisal = AppraisalService.archive(aid, tipo='acm')
    return _ok({'archived': aid})


@bp.route('/<int:aid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_appraisal(aid):
    AppraisalService.delete(aid, tipo='acm')
    return _ok({'deleted': aid})


@bp.route('/<int:aid>/restore', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def restore_appraisal(aid):
    try:
        appraisal = AppraisalService.restore(aid, tipo='acm')
        return _ok(appraisal.to_dict())
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:aid>/completar', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def completar_appraisal(aid):
    appraisal = AppraisalService.completar(aid, tipo='acm')
    return _ok(appraisal.to_dict())


@bp.route('/<int:aid>/logs', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_appraisal_logs(aid):
    AppraisalService.get_by_id_and_tipo(aid, 'acm')
    logs = AppraisalLog.query.filter_by(appraisal_id=aid)\
        .order_by(AppraisalLog.created_at.desc()).all()
    return _ok([l.to_dict() for l in logs])


@bp.route('/stats', methods=['GET'])
@require_role(ROLE_EDITOR)
def appraisal_stats():
    s = AppraisalService.stats(tipo='acm')
    total_v = db.session.query(db.func.sum(Appraisal.valor_estimado_usd)).filter(
        Appraisal.valor_estimado_usd.isnot(None)).scalar() or 0
    con_agente = Appraisal.query.filter(Appraisal.assigned_agent_id.isnot(None)).count()
    sin_agente = Appraisal.query.filter(Appraisal.assigned_agent_id.is_(None)).count()
    s['valor_total_estimado'] = round(total_v, 2)
    s['con_agente'] = con_agente
    s['sin_agente'] = sin_agente
    return _ok(s)


@bp.route('/<int:aid>/report', methods=['GET'])
@require_role(ROLE_EDITOR)
def appraisal_report(aid):
    appraisal = AppraisalService.get_by_id_and_tipo(aid, 'acm')
    a = appraisal
    comps = sorted(appraisal.comparables, key=lambda c: c.numero)

    AppraisalService.recalcular(appraisal)
    for c in comps:
        c.to_dict()

    def _v(val, fmt=''):
        if val is None or val == '':
            return '—'
        if fmt == 'usd':
            return f'USD {val:,.2f}'
        if fmt == 'ars':
            return f'ARS {val:,.2f}'
        if fmt == 'uva':
            return f'{val:,.2f} UVAs'
        if fmt == 'pct':
            return f'{val:.1f}%'
        return _html_escape(str(val))

    def _cmp_row(c):
        coef = c.coeficiente_ajuste
        ajustado = c.valor_m2_ajustado
        rmin = round(ajustado * 0.90, 2) if ajustado else None
        rprom = round(ajustado, 2) if ajustado else None
        rmax = round(ajustado * 1.10, 2) if ajustado else None

        def attr_label(attr):
            m = {'superior': '↑ Superior', 'equivalente': '= Equivalente', 'inferior': '↓ Inferior'}
            return m.get(getattr(c, attr, ''), '—')

        return f'''
        <tr>
            <td><strong>C{_html_escape(c.numero)}</strong></td>
            <td>{_html_escape(c.calle)} {_html_escape(c.numero_calle)}</td>
            <td>{_html_escape(c.barrio)}</td>
            <td>{_v(c.precio_usd, 'usd')}</td>
            <td>{_v(c.superficie_cubierta)}</td>
            <td>{_v(c.precio_por_m2, 'usd')}</td>
            <td>{_v(coef) if coef else '—'}</td>
            <td>{_v(ajustado, 'usd') if ajustado else '—'}</td>
            <td>{_v(rmin, 'usd') if rmin else '—'}</td>
            <td>{_v(rprom, 'usd') if rprom else '—'}</td>
            <td>{_v(rmax, 'usd') if rmax else '—'}</td>
        </tr>'''

    def _comodidades():
        items = []
        checks = [
            ('tiene_cocina', 'Cocina'), ('tiene_comedor', 'Comedor'),
            ('tiene_living', 'Living'), ('tiene_patio', 'Patio'),
            ('tiene_terraza', 'Terraza'), ('tiene_balcon', 'Balcón'),
            ('tiene_lavadero', 'Lavadero'), ('tiene_escritorio', 'Escritorio'),
            ('tiene_suite', 'Suite'), ('tiene_playroom', 'Play room'),
            ('tiene_asador', 'Asador'), ('tiene_piscina', 'Piscina'),
            ('tiene_garage', 'Garage'),
        ]
        for key, label in checks:
            if getattr(a, key, False):
                items.append(label)
        return ', '.join(items) or '—'

    def _servicios():
        items = []
        checks = [
            ('tiene_electricidad_publica', 'Electricidad'),
            ('tiene_gas_publico', 'Gas'), ('tiene_telefono_publico', 'Teléfono'),
            ('tiene_agua_publica', 'Agua'), ('tiene_cloaca_publica', 'Cloaca'),
            ('tiene_desague_pluvial', 'Des. pluvial'),
        ]
        for key, label in checks:
            if getattr(a, key, False):
                items.append(label)
        return ', '.join(items) or '—'

    _nonce = g.get('csp_nonce', '')
    html = f'''<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:wght@400;600;700;800&family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
<style nonce="{_nonce}">
  @page {{ margin: 12mm; size: A4; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ background: #0a0a0a; color: #ccc; font-family: 'Poppins', sans-serif; font-size: 10pt; line-height: 1.6; }}
  .report {{ max-width: 210mm; margin: 0 auto; padding: 0; }}
  .header {{ text-align: center; padding: 32px 0 24px; border-bottom: 1px solid rgba(32,184,171,0.15); margin-bottom: 28px; }}
  .header h1 {{ font-family: 'Anton', sans-serif; font-size: 26pt; font-weight: 400; color: #fff; letter-spacing: 3px; text-transform: uppercase; }}
  .header .sub {{ color: #20b8ab; font-family: 'Montserrat', sans-serif; font-size: 9pt; font-weight: 600; letter-spacing: 4px; text-transform: uppercase; margin-top: 4px; }}
  .header .meta {{ color: #666; font-size: 8pt; margin-top: 8px; font-weight: 300; }}
  .section-title {{ font-family: 'Anton', sans-serif; font-size: 13pt; font-weight: 400; color: #20b8ab; letter-spacing: 1px; text-transform: uppercase; margin: 24px 0 10px; padding-bottom: 4px; border-bottom: 1px solid rgba(32,184,171,0.1); }}
  .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }}
  .card {{ background: #111; border: 1px solid #222; border-radius: 6px; padding: 14px 16px; }}
  .card h3 {{ font-family: 'Montserrat', sans-serif; font-size: 8pt; font-weight: 600; color: #20b8ab; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }}
  .card p {{ font-size: 9pt; color: #bbb; margin: 2px 0; }}
  .card p strong {{ color: #fff; font-weight: 600; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 8.5pt; margin: 8px 0; }}
  th, td {{ padding: 5px 7px; text-align: left; border: 1px solid #222; }}
  th {{ background: #111; color: #20b8ab; font-family: 'Montserrat', sans-serif; font-weight: 600; font-size: 7.5pt; letter-spacing: 0.5px; text-transform: uppercase; }}
  td {{ color: #bbb; }}
  tr:nth-child(even) td {{ background: rgba(255,255,255,0.02); }}
  .result {{ background: linear-gradient(135deg, rgba(32,184,171,0.08), #0a0a0a); border: 1px solid rgba(32,184,171,0.2); border-radius: 8px; padding: 20px 24px; margin: 16px 0; }}
  .result table {{ background: transparent; border: none; }}
  .result td {{ border: none; padding: 4px 0; background: transparent !important; }}
  .result .label {{ color: #888; font-size: 9pt; }}
  .result .value {{ color: #fff; font-weight: 600; font-family: 'Montserrat', sans-serif; font-size: 10pt; }}
  .result .value-big {{ color: #20b8ab; font-family: 'Anton', sans-serif; font-size: 22pt; font-weight: 400; letter-spacing: 1px; }}
  .tag {{ display: inline-block; background: rgba(32,184,171,0.15); color: #20b8ab; padding: 2px 10px; border-radius: 3px; font-size: 7pt; font-weight: 600; font-family: 'Montserrat', sans-serif; letter-spacing: 1px; text-transform: uppercase; }}
  .footer {{ margin-top: 32px; padding-top: 12px; border-top: 1px solid #1a1a1a; text-align: center; font-size: 7.5pt; color: #555; }}
  .status-bar {{ display: flex; justify-content: center; gap: 16px; align-items: center; margin-top: 8px; }}
</style></head><body>
<div class="report">
<div class="header">
  <h1>ACM</h1>
  <div class="sub">Análisis Comparativo de Mercado</div>
  <div class="status-bar">
    <span class="tag">{_v(a.estado).upper()}</span>
    <span class="meta">Bienenhaus · Córdoba, Argentina</span>
  </div>
</div>

<div class="section-title">1. Datos de la tasación</div>
<div class="grid-2">
  <div class="card">
    <h3>Cliente</h3>
    <p><strong>Solicitante:</strong> {_v(a.solicitante)}</p>
    <p><strong>Teléfono:</strong> {_v(a.telefono)}</p>
    <p><strong>Fecha:</strong> {_v(a.fecha_tasacion)}</p>
    <p><strong>Destino:</strong> {_v(a.destino)}</p>
  </div>
  <div class="card">
    <h3>Inmueble tasado</h3>
    <p><strong>Dirección:</strong> {_v(a.direccion)}</p>
    <p><strong>Barrio:</strong> {_v(a.barrio)}, {_v(a.localidad)}</p>
    <p><strong>Tipo:</strong> {_v(a.tipo_propiedad)}</p>
    <p><strong>Año constr.:</strong> {_v(a.anio_construccion)}</p>
    <p><strong>Sup. terreno:</strong> {_v(a.superficie_terreno)} m² &nbsp;|&nbsp; <strong>Cubierta:</strong> {_v(a.superficie_cubierta)} m²</p>
    <p><strong>Dormitorios:</strong> {_v(a.dormitorios)} &nbsp;|&nbsp; <strong>Baños:</strong> {_v(a.banios)}</p>
  </div>
</div>

<div class="section-title">2. Características del inmueble</div>
<div class="grid-2">
  <div class="card">
    <h3>Construcción</h3>
    <p><strong>Tipo:</strong> {_v(a.tipo_construccion)}</p>
    <p><strong>Techo:</strong> {_v(a.tipo_techo)}</p>
    <p><strong>Orientación:</strong> {_v(a.orientacion)}</p>
    <p><strong>Luminosidad:</strong> {_v(a.luminosidad)}</p>
    <p><strong>Cal. constructiva:</strong> {_v(a.calidad_constructiva)}</p>
    <p><strong>Cal. mantenimiento:</strong> {_v(a.calidad_mantenimiento)}</p>
    <p><strong>Terminación:</strong> {_v(a.detalles_terminacion)}</p>
    <p><strong>Estado conservación:</strong> {_v(a.estado_conservacion)}</p>
    <p><strong>Estacionamiento:</strong> {_v(a.estacionamiento)}</p>
    <p><strong>Vida remanente:</strong> {_v(a.vida_remanente)} años</p>
  </div>
  <div class="card">
    <h3>Instalaciones</h3>
    <p><strong>Calefacción:</strong> {_v(a.calefaccion)}</p>
    <p><strong>Agua caliente:</strong> {_v(a.agua_caliente)}</p>
    <p><strong>Aire acond.:</strong> {_v(a.aire_acondicionado)}</p>
    <h3 style="margin-top:10px">Comodidades</h3>
    <p>{_comodidades()}</p>
    <h3 style="margin-top:10px">Servicios</h3>
    <p>{_servicios()}</p>
  </div>
</div>

<div class="section-title">3. Entorno urbano</div>
<div class="grid-2">
  <div class="card">
    <p><strong>Tipo barrio:</strong> {_v(a.tipo_barrio)}</p>
    <p><strong>Nivel construcción:</strong> {_v(a.nivel_construccion)}</p>
    <p><strong>Crecimiento:</strong> {_v(a.indice_crecimiento)}</p>
    <p><strong>Nivel socioeconómico:</strong> {_v(a.nivel_socioeconomico)}</p>
  </div>
  <div class="card">
    <p><strong>Valores propiedad:</strong> {_v(a.valores_propiedad)}</p>
    <p><strong>Demanda/Oferta:</strong> {_v(a.demanda_oferta)}</p>
    <p><strong>Tiempo comercialización:</strong> {_v(a.tiempo_comercializacion)}</p>
    <p><strong>Vigilancia:</strong> {'Sí' if a.vigilancia_barrio else 'No'}</p>
  </div>
</div>

<div class="section-title">4. Comparables de mercado</div>
<table>
  <thead><tr>
    <th>#</th><th>Dirección</th><th>Barrio</th><th>Precio</th><th>m²</th>
    <th>USD/m²</th><th>Coef.</th><th>Ajustado</th>
    <th>Rango mín</th><th>Rango prom</th><th>Rango máx</th>
  </tr></thead>
  <tbody>
    {''.join(_cmp_row(c) for c in comps) if comps else '<tr><td colspan="11" style="text-align:center;color:#555">Sin comparables cargados</td></tr>'}
  </tbody>
</table>

<div class="section-title">5. Valuación final</div>
<div class="result">
  <table>
    <tr><td class="label" style="width:50%">Precio/m² mínimo</td><td class="value">{_v(a.precio_m2_minimo, 'usd')}</td></tr>
    <tr><td class="label">Precio/m² promedio</td><td class="value">{_v(a.precio_m2_promedio, 'usd')}</td></tr>
    <tr><td class="label">Precio/m² máximo</td><td class="value">{_v(a.precio_m2_maximo, 'usd')}</td></tr>
    <tr><td class="label">Superficie cubierta</td><td class="value">{_v(a.superficie_cubierta)} m²</td></tr>
    <tr><td class="label" style="padding-top:8px"><strong style="color:#fff">VALOR ESTIMADO</strong></td><td class="value-big" style="padding-top:8px">{_v(a.valor_estimado_usd, 'usd')}</td></tr>
    <tr><td class="label">Valor en ARS</td><td class="value">{_v(a.valor_estimado_ars, 'ars')}</td></tr>
    <tr><td class="label">Valor en UVAs</td><td class="value">{_v(a.valor_estimado_uvas, 'uva')}</td></tr>
    <tr><td class="label">Dispersión</td><td class="value">{_v(a.dispersion_pct, 'pct')}</td></tr>
    <tr><td class="label">Coeficiente promedio</td><td class="value">{_v(a.coeficiente_promedio)}</td></tr>
    <tr><td class="label">Comparables utilizados</td><td class="value">{_v(a.total_comparables)}</td></tr>
  </table>
</div>

<p style="font-size:8pt;color:#555;margin-top:6px"><strong style="color:#888">T/C:</strong> {_v(a.tipo_cambio_usd, 'ars')} &nbsp;|&nbsp; <strong style="color:#888">UVA:</strong> {_v(a.valor_uva)}</p>

<div class="footer">
  <p>Informe generado por Bienenhaus · {date.today().strftime('%d/%m/%Y')}</p>
</div>
</div>
</body></html>'''
    return html, 200, {'Content-Type': 'text/html; charset=utf-8'}


@bp.route('/<int:aid>/comparables', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_comparables(aid):
    appraisal = AppraisalService.get_by_id_and_tipo(aid, 'acm')
    return _ok([c.to_dict() for c in appraisal.comparables])


@bp.route('/<int:aid>/comparables', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_comparable(aid):
    data = request.get_json(silent=True) or {}
    try:
        comp = AppraisalService.add_comparable(aid, data, tipo='acm')
        return _ok(comp.to_dict(), 201)
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:aid>/comparables/<int:cid>', methods=['PUT'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_comparable(aid, cid):
    data = request.get_json(silent=True) or {}
    try:
        comp = AppraisalService.update_comparable(aid, cid, data, tipo='acm')
        return _ok(comp.to_dict())
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:aid>/comparables/<int:cid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_comparable(aid, cid):
    try:
        AppraisalService.delete_comparable(aid, cid, tipo='acm')
        return _ok({'deleted': cid})
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:aid>/comparables/<int:cid>/toggle-exclusion', methods=['PATCH'])
@csrf_protect
@require_role(ROLE_EDITOR)
def toggle_comparable_exclusion(aid, cid):
    try:
        excluido = AppraisalService.toggle_comparable_exclusion(aid, cid, tipo='acm')
        return _ok({'excluido': excluido})
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:aid>/comparables/preview', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def preview_homologacion(aid):
    data = request.get_json(silent=True) or {}
    return _ok(AppraisalService.preview_homologacion(aid, data, tipo='acm'))


@bp.route('/<int:aid>/versions', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_versions(aid):
    AppraisalService.get_by_id_and_tipo(aid, 'acm')
    versions = AppraisalVersion.query.filter_by(appraisal_id=aid)\
        .order_by(AppraisalVersion.version.desc()).all()
    return _ok([v.to_dict() for v in versions])


@bp.route('/<int:aid>/versions/<int:version>', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_version(aid, version):
    ver = AppraisalVersion.query.filter_by(appraisal_id=aid, version=version)\
        .first_or_404()
    snapshot = ver.get_snapshot()
    return _ok({
        'version': ver.to_dict(),
        'snapshot': snapshot,
    })


@bp.route('/<int:aid>/versions/<int:va>/compare/<int:vb>', methods=['GET'])
@require_role(ROLE_EDITOR)
def compare_versions(aid, va, vb):
    v1 = AppraisalVersion.query.filter_by(appraisal_id=aid, version=va).first_or_404()
    v2 = AppraisalVersion.query.filter_by(appraisal_id=aid, version=vb).first_or_404()
    s1 = v1.get_snapshot() or {}
    s2 = v2.get_snapshot() or {}

    def flatten(obj, prefix=''):
        items = {}
        if isinstance(obj, dict):
            for k, v in obj.items():
                items.update(flatten(v, f'{prefix}{k}.'))
        elif isinstance(obj, list):
            for i, v in enumerate(obj):
                items.update(flatten(v, f'{prefix}{i}.'))
        else:
            items[prefix.rstrip('.')] = obj
        return items

    f1 = flatten(s1.get('appraisal', {}))
    f2 = flatten(s2.get('appraisal', {}))
    all_keys = sorted(set(f1) | set(f2))
    changes = []
    for k in all_keys:
        a = f1.get(k)
        b = f2.get(k)
        if a != b:
            changes.append({'field': k, 'from': a, 'to': b})

    c1 = s1.get('comparables', [])
    c2 = s2.get('comparables', [])
    comp_changes = []
    for c in c2:
        old = next((x for x in c1 if x.get('numero') == c.get('numero')), None)
        if old:
            for f in ['calle', 'numero_calle', 'precio_usd', 'superficie_cubierta',
                       'dormitorios', 'banios', 'coeficiente_ajuste', 'valor_m2_ajustado']:
                va_val = old.get(f)
                vb_val = c.get(f)
                if va_val != vb_val:
                    comp_changes.append({
                        'numero': c.get('numero'),
                        'field': f, 'from': va_val, 'to': vb_val,
                    })
        else:
            comp_changes.append({
                'numero': c.get('numero'), 'field': '__added__',
                'from': None, 'to': 'Nuevo comparable',
            })
    for c in c1:
        if not any(x.get('numero') == c.get('numero') for x in c2):
            comp_changes.append({
                'numero': c.get('numero'), 'field': '__removed__',
                'from': 'Comparable eliminado', 'to': None,
            })

    return _ok({
        'version_a': va, 'version_b': vb,
        'appraisal_changes': changes,
        'comparable_changes': comp_changes,
    })


@bp.route('/<int:aid>/new-version', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_new_version(aid):
    try:
        appraisal = AppraisalService.create_new_version(aid, tipo='acm')
        return _ok(appraisal.to_dict())
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:aid>/csv', methods=['GET'])
@require_role(ROLE_EDITOR)
def export_csv(aid):
    csv_str = AppraisalService.export_csv(aid, tipo='acm')
    return csv_str, 200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': f'attachment; filename="tasacion_{aid}.csv"',
    }


# ── MANAGEMENT ROUTES (Módulo 12) ────────────────────────────────────

@bp.route('/agents', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_appraisal_agents():
    from models import Agent
    agents = Agent.query.order_by(Agent.name).all()
    return _ok([{'id': a.id, 'name': f'{a.name} {a.last}'} for a in agents])


@bp.route('/<int:aid>/timeline', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_appraisal_timeline(aid):
    AppraisalService.get_by_id_and_tipo(aid, 'acm')
    items = AppraisalTimeline.query.filter_by(appraisal_id=aid)\
        .order_by(AppraisalTimeline.created_at.desc()).all()
    return _ok([i.to_dict() for i in items])


@bp.route('/<int:aid>/timeline', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def add_appraisal_timeline(aid):
    AppraisalService.get_by_id_and_tipo(aid, 'acm')
    data = request.get_json(silent=True) or {}
    event = AppraisalTimeline(
        appraisal_id=aid,
        event_type=data.get('event_type', 'nota'),
        description=data.get('description', ''),
        user_id=session.get('user_id'),
    )
    db.session.add(event)
    db.session.commit()
    return _ok(event.to_dict(), 201)


@bp.route('/<int:aid>/comments', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_appraisal_comments(aid):
    AppraisalService.get_by_id_and_tipo(aid, 'acm')
    items = AppraisalComment.query.filter_by(appraisal_id=aid)\
        .order_by(AppraisalComment.created_at.asc()).all()
    return _ok([i.to_dict() for i in items])


@bp.route('/<int:aid>/comments', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def add_appraisal_comment(aid):
    AppraisalService.get_by_id_and_tipo(aid, 'acm')
    data = request.get_json(silent=True) or {}
    content = (data.get('content') or '').strip()
    if not content:
        return _err('El comentario no puede estar vacío.')
    comment = AppraisalComment(
        appraisal_id=aid,
        user_id=session.get('user_id'),
        content=content,
    )
    db.session.add(comment)
    t = AppraisalTimeline(
        appraisal_id=aid,
        event_type='comentario',
        description='Nuevo comentario agregado',
        user_id=session.get('user_id'),
    )
    db.session.add(t)
    db.session.commit()
    return _ok(comment.to_dict(), 201)


@bp.route('/<int:aid>/files', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_appraisal_files(aid):
    AppraisalService.get_by_id_and_tipo(aid, 'acm')
    items = AppraisalFile.query.filter_by(appraisal_id=aid)\
        .order_by(AppraisalFile.created_at.desc()).all()
    return _ok([i.to_dict() for i in items])


@bp.route('/<int:aid>/files', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def upload_appraisal_file(aid):
    f = request.files.get('file')
    if not f or not f.filename:
        return _err('No se recibió ningún archivo.')
    import os
    from werkzeug.utils import secure_filename
    upload_dir = os.path.join('uploads', 'appraisals', str(aid))
    os.makedirs(upload_dir, exist_ok=True)
    safe = secure_filename(f.filename)
    path = os.path.join(upload_dir, safe)
    f.save(path)
    af = AppraisalFile(
        appraisal_id=aid,
        filename=path,
        original_name=f.filename,
        file_type=f.content_type or '',
        file_size=os.path.getsize(path),
        uploaded_by=session.get('user_id'),
    )
    db.session.add(af)
    db.session.commit()
    return _ok(af.to_dict(), 201)


@bp.route('/<int:aid>/files/<int:fid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_appraisal_file(aid, fid):
    af = db.session.get(AppraisalFile, fid)
    if not af or af.appraisal_id != aid:
        return _err('Archivo no encontrado.')
    import os
    if os.path.exists(af.filename):
        os.remove(af.filename)
    db.session.delete(af)
    db.session.commit()
    return _ok({'deleted': fid})


@bp.route('/<int:aid>/assign', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def assign_appraisal_agent(aid):
    data = request.get_json(silent=True) or {}
    appraisal = AppraisalService.get_by_id_and_tipo(aid, 'acm')
    agent_id = data.get('agent_id')
    appraisal.assigned_agent_id = agent_id
    from models import Agent
    agent_name = ''
    if agent_id:
        ag = db.session.get(Agent, agent_id)
        agent_name = f'{ag.name} {ag.last}' if ag else ''
    desc = f'Agente asignado: {agent_name}' if agent_name else 'Agente desasignado'
    t = AppraisalTimeline(
        appraisal_id=aid, event_type='asignacion',
        description=desc, user_id=session.get('user_id'),
    )
    db.session.add(t)
    db.session.commit()
    return _ok(appraisal.to_dict())


@bp.route('/<int:aid>/status', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def change_appraisal_status(aid):
    data = request.get_json(silent=True) or {}
    estado = data.get('estado', '')
    valid = ('borrador', 'en_proceso', 'completada', 'archivada')
    if estado not in valid:
        return _err('Estado inválido.')
    appraisal = AppraisalService.get_by_id_and_tipo(aid, 'acm')
    old = appraisal.estado
    appraisal.estado = estado
    t = AppraisalTimeline(
        appraisal_id=aid, event_type='estado',
        description=f'Estado cambiado: {old} → {estado}',
        user_id=session.get('user_id'),
    )
    db.session.add(t)
    db.session.commit()
    return _ok(appraisal.to_dict())


@bp.route('/<int:aid>/convert-property', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def convert_appraisal_to_property(aid):
    appraisal = AppraisalService.get_by_id_and_tipo(aid, 'acm')
    data = request.get_json(silent=True) or {}
    from models import Property
    codigo = f'TAS-{appraisal.id}'
    p = Property(
        title=appraisal.titulo or f'Tasación {appraisal.solicitante}',
        description=appraisal.observaciones or '',
        price=appraisal.valor_estimado_usd or 0,
        operation_type=data.get('operation_type', 'venta'),
        property_type=appraisal.tipo_propiedad or 'casa',
        address=appraisal.direccion or '',
        neighborhood=appraisal.barrio or '',
        city=appraisal.localidad or '',
        province=appraisal.provincia or 'Córdoba',
        bedrooms=appraisal.dormitorios or 0,
        bathrooms=appraisal.banios or 0,
        covered_area=appraisal.superficie_cubierta or 0,
        total_area=appraisal.superficie_terreno or 0,
        code=codigo,
        status='disponible',
        agent_id=appraisal.assigned_agent_id,
    )
    db.session.add(p)
    db.session.flush()
    t = AppraisalTimeline(
        appraisal_id=aid, event_type='conversion',
        description=f'Propiedad creada #{p.id}: {p.title}',
        user_id=session.get('user_id'),
    )
    db.session.add(t)
    db.session.commit()
    return _ok({'property_id': p.id, 'property_title': p.title}, 201)
