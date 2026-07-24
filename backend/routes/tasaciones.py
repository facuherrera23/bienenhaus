from typing import Any
from datetime import date, datetime
from sqlalchemy.orm import load_only
from flask import Blueprint, request, jsonify, render_template_string, g, session
from extensions import db, limiter
from models import Tasacion, TasacionVersion, TasacionComparable, TasacionLog, TasacionComment, TasacionFile, TasacionTimeline, Appraisal, AppraisalVersion
from csrf import csrf_protect
from auth_helper import require_role, ROLE_EDITOR
from services import AppraisalService
from services.appraisal_service import FACTOR_MAP, parse_date, geocode
from utils import _ok, _err, _html_escape
from .appraisal_handlers import handle_appraisal

bp = Blueprint('tasaciones', __name__, url_prefix='/api/tasaciones')


# ── CRUD unificado (compatibilidad) ─────────────────────────────
bp.add_url_rule(
    '/<int:tid>',
    view_func=handle_appraisal,
    defaults={'tipo': 'tasacion'},
    methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    endpoint='tasacion_detail_legacy'
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


@bp.route('/<int:tid>/map-data', methods=['GET'])
@require_role(ROLE_EDITOR)
def tasacion_map_data(tid):
    tasacion = AppraisalService.get_by_id_and_tipo(tid, 'tasacion')
    addr_parts = [p for p in [tasacion.direccion, tasacion.barrio, tasacion.localidad] if p]
    tasacion_addr = ', '.join(addr_parts) if addr_parts else None
    alat, alng = geocode(tasacion_addr) if tasacion_addr else (None, None)

    comps = []
    for c in tasacion.comparables:
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
        'tasacion': {
            'id': tasacion.id,
            'titulo': tasacion.titulo or tasacion.solicitante,
            'direccion': tasacion_addr,
            'superficie_cubierta': tasacion.superficie_cubierta,
            'superficie_terreno': tasacion.superficie_terreno,
            'tipo_propiedad': tasacion.tipo_propiedad,
            'valor_estimado_usd': tasacion.valor_estimado_usd,
            'precio_m2_promedio': tasacion.precio_m2_promedio,
            'coeficiente_promedio': tasacion.coeficiente_promedio,
            'lat': alat, 'lng': alng,
        },
        'comparables': comps,
    })


@bp.route('', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_tasaciones():
    estado = request.args.get('estado', '')
    incluir_archivadas = request.args.get('archivadas', '') == '1'
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '').strip()
    return _ok(AppraisalService.list_appraisals(
        estado=estado, incluir_archivadas=incluir_archivadas,
        page=page, per_page=per_page, search=search, tipo='tasacion',
    ))


@bp.route('', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_tasacion():
    data = request.get_json(silent=True) or {}
    try:
        tasacion = AppraisalService.create(data, tipo='tasacion')
        return _ok(tasacion.to_dict(), 201)
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:tid>', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_tasacion(tid):
    tasacion = AppraisalService.get_by_id_and_tipo(tid, 'tasacion')
    return _ok(tasacion.to_dict())


@bp.route('/<int:tid>/pdf', methods=['GET'])
@require_role(ROLE_EDITOR)
def download_tasacion_pdf(tid):
    tasacion = AppraisalService.get_by_id_and_tipo(tid, 'tasacion')
    from scripts.appraisal_pdf import build_pdf
    pdf_bytes = build_pdf(tasacion)
    filename = f'tasacion_{tasacion.id}_{tasacion.titulo or "informe"}.pdf'
    filename = ''.join(c if c.isalnum() or c in ('-', '_', '.') else '_' for c in filename)
    return pdf_bytes, 200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': f'attachment; filename="{filename}"',
    }


@bp.route('/<int:tid>', methods=['PUT'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_tasacion(tid):
    data = request.get_json(silent=True) or {}
    try:
        tasacion = AppraisalService.update(tid, data, tipo='tasacion')
        return _ok(tasacion.to_dict())
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:tid>/calculate', methods=['GET'])
@require_role(ROLE_EDITOR)
def calculate_tasacion(tid):
    tasacion = AppraisalService.get_by_id_and_tipo(tid, 'tasacion')
    AppraisalService.recalcular(tasacion)
    db.session.commit()
    return _ok(tasacion.to_dict())


@bp.route('/<int:tid>/archive', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def archive_tasacion(tid):
    tasacion = AppraisalService.archive(tid, tipo='tasacion')
    return _ok({'archived': tid})


@bp.route('/<int:tid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_tasacion(tid):
    AppraisalService.delete(tid, tipo='tasacion')
    return _ok({'deleted': tid})


@bp.route('/<int:tid>/restore', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def restore_tasacion(tid):
    try:
        tasacion = AppraisalService.restore(tid, tipo='tasacion')
        return _ok(tasacion.to_dict())
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:tid>/completar', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def completar_tasacion(tid):
    tasacion = AppraisalService.completar(tid, tipo='tasacion')
    return _ok(tasacion.to_dict())


@bp.route('/<int:tid>/logs', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_tasacion_logs(tid):
    AppraisalService.get_by_id_and_tipo(tid, 'tasacion')
    logs = TasacionLog.query.filter_by(tasacion_id=tid)\
        .order_by(TasacionLog.created_at.desc()).all()
    return _ok([l.to_dict() for l in logs])


@bp.route('/stats', methods=['GET'])
@require_role(ROLE_EDITOR)
def tasacion_stats():
    s = AppraisalService.stats(tipo='tasacion')
    total_v = db.session.query(db.func.sum(Appraisal.valor_estimado_usd)).filter(
        Appraisal.valor_estimado_usd.isnot(None), Appraisal.tipo == 'tasacion').scalar() or 0
    con_agente = Appraisal.query.filter(Appraisal.assigned_agent_id.isnot(None), Appraisal.tipo == 'tasacion').count()
    sin_agente = Appraisal.query.filter(Appraisal.assigned_agent_id.is_(None), Appraisal.tipo == 'tasacion').count()
    s['valor_total_estimado'] = round(total_v, 2)
    s['con_agente'] = con_agente
    s['sin_agente'] = sin_agente
    return _ok(s)


@bp.route('/<int:tid>/report', methods=['GET'])
@require_role(ROLE_EDITOR)
def tasacion_report(tid):
    tasacion = AppraisalService.get_by_id_and_tipo(tid, 'tasacion')
    a = tasacion
    comps = sorted(tasacion.comparables, key=lambda c: c.numero)

    AppraisalService.recalcular(tasacion)
    for c in comps:
        c.to_dict()

    def _v(val, fmt=''):
        if val is None or val == '':
            return '\u2014'
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
        return f'''
        <tr>
            <td><strong>C{_html_escape(c.numero)}</strong></td>
            <td>{_html_escape(c.calle)} {_html_escape(c.numero_calle)}</td>
            <td>{_html_escape(c.barrio)}</td>
            <td>{_v(c.precio_usd, 'usd')}</td>
            <td>{_v(c.superficie_cubierta)}</td>
            <td>{_v(c.precio_por_m2, 'usd')}</td>
            <td>{_v(coef) if coef else '\u2014'}</td>
            <td>{_v(ajustado, 'usd') if ajustado else '\u2014'}</td>
            <td>{_v(rmin, 'usd') if rmin else '\u2014'}</td>
            <td>{_v(rprom, 'usd') if rprom else '\u2014'}</td>
            <td>{_v(rmax, 'usd') if rmax else '\u2014'}</td>
        </tr>'''

    def _comodidades():
        items = []
        checks = [
            ('tiene_cocina', 'Cocina'), ('tiene_comedor', 'Comedor'),
            ('tiene_living', 'Living'), ('tiene_patio', 'Patio'),
            ('tiene_terraza', 'Terraza'), ('tiene_balcon', 'Balc\u00f3n'),
            ('tiene_lavadero', 'Lavadero'), ('tiene_escritorio', 'Escritorio'),
            ('tiene_suite', 'Suite'), ('tiene_playroom', 'Play room'),
            ('tiene_asador', 'Asador'), ('tiene_piscina', 'Piscina'),
            ('tiene_garage', 'Garage'),
        ]
        for key, label in checks:
            if getattr(a, key, False):
                items.append(label)
        return ', '.join(items) or '\u2014'

    def _servicios():
        items = []
        checks = [
            ('tiene_electricidad_publica', 'Electricidad'),
            ('tiene_gas_publico', 'Gas'), ('tiene_telefono_publico', 'Tel\u00e9fono'),
            ('tiene_agua_publica', 'Agua'), ('tiene_cloaca_publica', 'Cloaca'),
            ('tiene_desague_pluvial', 'Des. pluvial'),
        ]
        for key, label in checks:
            if getattr(a, key, False):
                items.append(label)
        return ', '.join(items) or '\u2014'

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
  <h1>TASACI\u00d3N</h1>
  <div class="sub">Informe de Valuaci\u00f3n</div>
  <div class="status-bar">
    <span class="tag">{_v(a.estado).upper()}</span>
    <span class="meta">Bienenhaus \u00b7 C\u00f3rdoba, Argentina</span>
  </div>
</div>

<div class="section-title">1. Datos de la tasaci\u00f3n</div>
<div class="grid-2">
  <div class="card">
    <h3>Cliente</h3>
    <p><strong>Solicitante:</strong> {_v(a.solicitante)}</p>
    <p><strong>Tel\u00e9fono:</strong> {_v(a.telefono)}</p>
    <p><strong>Fecha:</strong> {_v(a.fecha_tasacion)}</p>
    <p><strong>Destino:</strong> {_v(a.destino)}</p>
  </div>
  <div class="card">
    <h3>Inmueble tasado</h3>
    <p><strong>Direcci\u00f3n:</strong> {_v(a.direccion)}</p>
    <p><strong>Barrio:</strong> {_v(a.barrio)}, {_v(a.localidad)}</p>
    <p><strong>Tipo:</strong> {_v(a.tipo_propiedad)}</p>
    <p><strong>A\u00f1o constr.:</strong> {_v(a.anio_construccion)}</p>
    <p><strong>Sup. terreno:</strong> {_v(a.superficie_terreno)} m\u00b2 &nbsp;|&nbsp; <strong>Cubierta:</strong> {_v(a.superficie_cubierta)} m\u00b2</p>
    <p><strong>Dormitorios:</strong> {_v(a.dormitorios)} &nbsp;|&nbsp; <strong>Ba\u00f1os:</strong> {_v(a.banios)}</p>
  </div>
</div>

<div class="section-title">2. Caracter\u00edsticas del inmueble</div>
<div class="grid-2">
  <div class="card">
    <h3>Construcci\u00f3n</h3>
    <p><strong>Tipo:</strong> {_v(a.tipo_construccion)}</p>
    <p><strong>Techo:</strong> {_v(a.tipo_techo)}</p>
    <p><strong>Orientaci\u00f3n:</strong> {_v(a.orientacion)}</p>
    <p><strong>Luminosidad:</strong> {_v(a.luminosidad)}</p>
    <p><strong>Cal. constructiva:</strong> {_v(a.calidad_constructiva)}</p>
    <p><strong>Cal. mantenimiento:</strong> {_v(a.calidad_mantenimiento)}</p>
    <p><strong>Terminaci\u00f3n:</strong> {_v(a.detalles_terminacion)}</p>
    <p><strong>Estado conservaci\u00f3n:</strong> {_v(a.estado_conservacion)}</p>
    <p><strong>Estacionamiento:</strong> {_v(a.estacionamiento)}</p>
    <p><strong>Vida remanente:</strong> {_v(a.vida_remanente)} a\u00f1os</p>
  </div>
  <div class="card">
    <h3>Instalaciones</h3>
    <p><strong>Calefacci\u00f3n:</strong> {_v(a.calefaccion)}</p>
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
    <p><strong>Nivel construcci\u00f3n:</strong> {_v(a.nivel_construccion)}</p>
    <p><strong>Crecimiento:</strong> {_v(a.indice_crecimiento)}</p>
    <p><strong>Nivel socioecon\u00f3mico:</strong> {_v(a.nivel_socioeconomico)}</p>
  </div>
  <div class="card">
    <p><strong>Valores propiedad:</strong> {_v(a.valores_propiedad)}</p>
    <p><strong>Demanda/Oferta:</strong> {_v(a.demanda_oferta)}</p>
    <p><strong>Tiempo comercializaci\u00f3n:</strong> {_v(a.tiempo_comercializacion)}</p>
    <p><strong>Vigilancia:</strong> {'S\u00ed' if a.vigilancia_barrio else 'No'}</p>
  </div>
</div>

<div class="section-title">4. Comparables de mercado</div>
<table>
  <thead><tr>
    <th>#</th><th>Direcci\u00f3n</th><th>Barrio</th><th>Precio</th><th>m\u00b2</th>
    <th>USD/m\u00b2</th><th>Coef.</th><th>Ajustado</th>
    <th>Rango m\u00edn</th><th>Rango prom</th><th>Rango m\u00e1x</th>
  </tr></thead>
  <tbody>
    {''.join(_cmp_row(c) for c in comps) if comps else '<tr><td colspan="11" style="text-align:center;color:#555">Sin comparables cargados</td></tr>'}
  </tbody>
</table>

<div class="section-title">5. Valuaci\u00f3n final</div>
<div class="result">
  <table>
    <tr><td class="label" style="width:50%">Precio/m\u00b2 m\u00ednimo</td><td class="value">{_v(a.precio_m2_minimo, 'usd')}</td></tr>
    <tr><td class="label">Precio/m\u00b2 promedio</td><td class="value">{_v(a.precio_m2_promedio, 'usd')}</td></tr>
    <tr><td class="label">Precio/m\u00b2 m\u00e1ximo</td><td class="value">{_v(a.precio_m2_maximo, 'usd')}</td></tr>
    <tr><td class="label">Superficie cubierta</td><td class="value">{_v(a.superficie_cubierta)} m\u00b2</td></tr>
    <tr><td class="label" style="padding-top:8px"><strong style="color:#fff">VALOR ESTIMADO</strong></td><td class="value-big" style="padding-top:8px">{_v(a.valor_estimado_usd, 'usd')}</td></tr>
    <tr><td class="label">Valor en ARS</td><td class="value">{_v(a.valor_estimado_ars, 'ars')}</td></tr>
    <tr><td class="label">Valor en UVAs</td><td class="value">{_v(a.valor_estimado_uvas, 'uva')}</td></tr>
    <tr><td class="label">Dispersi\u00f3n</td><td class="value">{_v(a.dispersion_pct, 'pct')}</td></tr>
    <tr><td class="label">Coeficiente promedio</td><td class="value">{_v(a.coeficiente_promedio)}</td></tr>
    <tr><td class="label">Comparables utilizados</td><td class="value">{_v(a.total_comparables)}</td></tr>
  </table>
</div>

<p style="font-size:8pt;color:#555;margin-top:6px"><strong style="color:#888">T/C:</strong> {_v(a.tipo_cambio_usd, 'ars')} &nbsp;|&nbsp; <strong style="color:#888">UVA:</strong> {_v(a.valor_uva)}</p>

<div class="footer">
  <p>Informe generado por Bienenhaus &middot; {date.today().strftime('%d/%m/%Y')}</p>
</div>
</div>
</body></html>'''
    return html, 200, {'Content-Type': 'text/html; charset=utf-8'}


@bp.route('/<int:tid>/comparables', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_comparables(tid):
    tasacion = AppraisalService.get_by_id_and_tipo(tid, 'tasacion')
    return _ok([c.to_dict() for c in tasacion.comparables])


@bp.route('/<int:tid>/comparables', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_comparable(tid):
    data = request.get_json(silent=True) or {}
    try:
        comp = AppraisalService.add_comparable(tid, data, tipo='tasacion')
        return _ok(comp.to_dict(), 201)
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:tid>/comparables/<int:cid>', methods=['PUT'])
@csrf_protect
@require_role(ROLE_EDITOR)
def update_comparable(tid, cid):
    data = request.get_json(silent=True) or {}
    try:
        comp = AppraisalService.update_comparable(tid, cid, data, tipo='tasacion')
        return _ok(comp.to_dict())
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:tid>/comparables/<int:cid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_comparable(tid, cid):
    try:
        AppraisalService.delete_comparable(tid, cid, tipo='tasacion')
        return _ok({'deleted': cid})
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:tid>/comparables/<int:cid>/toggle-exclusion', methods=['PATCH'])
@csrf_protect
@require_role(ROLE_EDITOR)
def toggle_comparable_exclusion(tid, cid):
    try:
        excluido = AppraisalService.toggle_comparable_exclusion(tid, cid, tipo='tasacion')
        return _ok({'excluido': excluido})
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:tid>/comparables/preview', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def preview_homologacion(tid):
    data = request.get_json(silent=True) or {}
    return _ok(AppraisalService.preview_homologacion(tid, data, tipo='tasacion'))


@bp.route('/<int:tid>/versions', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_versions(tid):
    AppraisalService.get_by_id_and_tipo(tid, 'tasacion')
    versions = AppraisalVersion.query.filter_by(appraisal_id=tid)\
        .order_by(AppraisalVersion.version.desc()).all()
    return _ok([v.to_dict() for v in versions])


@bp.route('/<int:tid>/versions/<int:version>', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_version(tid, version):
    ver = AppraisalVersion.query.filter_by(appraisal_id=tid, version=version)\
        .first_or_404()
    snapshot = ver.get_snapshot()
    return _ok({
        'version': ver.to_dict(),
        'snapshot': snapshot,
    })


@bp.route('/<int:tid>/versions/<int:va>/compare/<int:vb>', methods=['GET'])
@require_role(ROLE_EDITOR)
def compare_versions(tid, va, vb):
    v1 = AppraisalVersion.query.filter_by(appraisal_id=tid, version=va).first_or_404()
    v2 = AppraisalVersion.query.filter_by(appraisal_id=tid, version=vb).first_or_404()
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

    f1 = flatten(s1.get('tasacion', {}))
    f2 = flatten(s2.get('tasacion', {}))
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
        'tasacion_changes': changes,
        'comparable_changes': comp_changes,
    })


@bp.route('/<int:tid>/new-version', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def create_new_version(tid):
    try:
        tasacion = AppraisalService.create_new_version(tid, tipo='tasacion')
        return _ok(tasacion.to_dict())
    except ValueError as e:
        return _err(str(e))


@bp.route('/<int:tid>/csv', methods=['GET'])
@require_role(ROLE_EDITOR)
def export_csv(tid):
    csv_str = AppraisalService.export_csv(tid, tipo='tasacion')
    return csv_str, 200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': f'attachment; filename="tasacion_{tid}.csv"',
    }


@bp.route('/agents', methods=['GET'])
@require_role(ROLE_EDITOR)
def list_tasacion_agents():
    from models import Agent
    agents = Agent.query.order_by(Agent.name).all()
    return _ok([{'id': a.id, 'name': f'{a.name} {a.last}'} for a in agents])


@bp.route('/<int:tid>/timeline', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_tasacion_timeline(tid):
    AppraisalService.get_by_id_and_tipo(tid, 'tasacion')
    items = TasacionTimeline.query.filter_by(tasacion_id=tid)\
        .order_by(TasacionTimeline.created_at.desc()).all()
    return _ok([i.to_dict() for i in items])


@bp.route('/<int:tid>/timeline', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def add_tasacion_timeline(tid):
    AppraisalService.get_by_id_and_tipo(tid, 'tasacion')
    data = request.get_json(silent=True) or {}
    event = TasacionTimeline(
        tasacion_id=tid,
        event_type=data.get('event_type', 'nota'),
        description=data.get('description', ''),
        user_id=session.get('user_id'),
    )
    db.session.add(event)
    db.session.commit()
    return _ok(event.to_dict(), 201)


@bp.route('/<int:tid>/comments', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_tasacion_comments(tid):
    AppraisalService.get_by_id_and_tipo(tid, 'tasacion')
    items = TasacionComment.query.filter_by(tasacion_id=tid)\
        .order_by(TasacionComment.created_at.asc()).all()
    return _ok([i.to_dict() for i in items])


@bp.route('/<int:tid>/comments', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def add_tasacion_comment(tid):
    AppraisalService.get_by_id_and_tipo(tid, 'tasacion')
    data = request.get_json(silent=True) or {}
    content = (data.get('content') or '').strip()
    if not content:
        return _err('El comentario no puede estar vacío.')
    comment = TasacionComment(
        tasacion_id=tid,
        user_id=session.get('user_id'),
        content=content,
    )
    db.session.add(comment)
    t = TasacionTimeline(
        tasacion_id=tid,
        event_type='comentario',
        description='Nuevo comentario agregado',
        user_id=session.get('user_id'),
    )
    db.session.add(t)
    db.session.commit()
    return _ok(comment.to_dict(), 201)


@bp.route('/<int:tid>/files', methods=['GET'])
@require_role(ROLE_EDITOR)
def get_tasacion_files(tid):
    AppraisalService.get_by_id_and_tipo(tid, 'tasacion')
    items = TasacionFile.query.filter_by(tasacion_id=tid)\
        .order_by(TasacionFile.created_at.desc()).all()
    return _ok([i.to_dict() for i in items])


@bp.route('/<int:tid>/files', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def upload_tasacion_file(tid):
    AppraisalService.get_by_id_and_tipo(tid, 'tasacion')
    f = request.files.get('file')
    if not f or not f.filename:
        return _err('No se recibió ningún archivo.')
    import os
    from werkzeug.utils import secure_filename
    upload_dir = os.path.join('uploads', 'tasaciones', str(tid))
    os.makedirs(upload_dir, exist_ok=True)
    safe = secure_filename(f.filename)
    path = os.path.join(upload_dir, safe)
    f.save(path)
    af = TasacionFile(
        tasacion_id=tid,
        filename=path,
        original_name=f.filename,
        file_type=f.content_type or '',
        file_size=os.path.getsize(path),
        uploaded_by=session.get('user_id'),
    )
    db.session.add(af)
    db.session.commit()
    return _ok(af.to_dict(), 201)


@bp.route('/<int:tid>/files/<int:fid>', methods=['DELETE'])
@csrf_protect
@require_role(ROLE_EDITOR)
def delete_tasacion_file(tid, fid):
    AppraisalService.get_by_id_and_tipo(tid, 'tasacion')
    af = db.session.get(TasacionFile, fid)
    if not af or af.tasacion_id != tid:
        return _err('Archivo no encontrado.')
    import os
    if os.path.exists(af.filename):
        os.remove(af.filename)
    db.session.delete(af)
    db.session.commit()
    return _ok({'deleted': fid})


@bp.route('/<int:tid>/assign', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def assign_tasacion_agent(tid):
    data = request.get_json(silent=True) or {}
    tasacion = AppraisalService.get_by_id_and_tipo(tid, 'tasacion')
    agent_id = data.get('agent_id')
    tasacion.assigned_agent_id = agent_id
    from models import Agent
    agent_name = ''
    if agent_id:
        ag = db.session.get(Agent, agent_id)
        agent_name = f'{ag.name} {ag.last}' if ag else ''
    desc = f'Agente asignado: {agent_name}' if agent_name else 'Agente desasignado'
    t = TasacionTimeline(
        tasacion_id=tid, event_type='asignacion',
        description=desc, user_id=session.get('user_id'),
    )
    db.session.add(t)
    db.session.commit()
    return _ok(tasacion.to_dict())


@bp.route('/<int:tid>/status', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def change_tasacion_status(tid):
    data = request.get_json(silent=True) or {}
    estado = data.get('estado', '')
    valid = ('borrador', 'en_proceso', 'completada', 'archivada')
    if estado not in valid:
        return _err('Estado inválido.')
    tasacion = AppraisalService.get_by_id_and_tipo(tid, 'tasacion')
    old = tasacion.estado
    tasacion.estado = estado
    t = TasacionTimeline(
        tasacion_id=tid, event_type='estado',
        description=f'Estado cambiado: {old} → {estado}',
        user_id=session.get('user_id'),
    )
    db.session.add(t)
    db.session.commit()
    return _ok(tasacion.to_dict())


@bp.route('/<int:tid>/convert-property', methods=['POST'])
@csrf_protect
@require_role(ROLE_EDITOR)
def convert_tasacion_to_property(tid):
    tasacion = AppraisalService.get_by_id_and_tipo(tid, 'tasacion')
    data = request.get_json(silent=True) or {}
    from models import Property
    codigo = f'TAS-{tasacion.id}'
    p = Property(
        title=tasacion.titulo or f'Tasaci\u00f3n {tasacion.solicitante}',
        description=tasacion.observaciones or '',
        price=tasacion.valor_estimado_usd or 0,
        operation_type=data.get('operation_type', 'venta'),
        property_type=tasacion.tipo_propiedad or 'casa',
        address=tasacion.direccion or '',
        neighborhood=tasacion.barrio or '',
        city=tasacion.localidad or '',
        province=tasacion.provincia or 'C\u00f3rdoba',
        bedrooms=tasacion.dormitorios or 0,
        bathrooms=tasacion.banios or 0,
        covered_area=tasacion.superficie_cubierta or 0,
        total_area=tasacion.superficie_terreno or 0,
        code=codigo,
        status='disponible',
        agent_id=tasacion.assigned_agent_id,
    )
    db.session.add(p)
    db.session.flush()
    t = TasacionTimeline(
        tasacion_id=tid, event_type='conversion',
        description=f'Propiedad creada #{p.id}: {p.title}',
        user_id=session.get('user_id'),
    )
    db.session.add(t)
    db.session.commit()
    return _ok({'property_id': p.id, 'property_title': p.title}, 201)
