from __future__ import annotations

import csv
import io
import json
import time
import statistics
import logging
import urllib.request
import urllib.parse
from typing import Any
from datetime import date, datetime, timezone
from flask import session, current_app
from extensions import db
from models import Appraisal, AppraisalVersion, Comparable, AppraisalLog, AppraisalRequest
from services.tasacion_sync import TasacionSync
from extraction import extract_property
from scrapers.metrics import get_stats as get_scraper_stats
from utils import _ok, _err, _validate_url, _html_escape

logger = logging.getLogger(__name__)

FACTOR_MAP: dict[str, float] = {
    'comp_ubicacion': 0.07,
    'comp_estado_mantenimiento': 0.04,
    'comp_antiguedad': 0.04,
    'comp_habitaciones': 0.03,
    'comp_estacionamiento': 0.02,
    'comp_comodidades': 0.03,
    'comp_orientacion': 0.02,
    'comp_vistas': 0.02,
    'comp_nivel_piso': 0.03,
}

COMP_ATTRS = list(FACTOR_MAP.keys())
_FACTOR_ADJ = {'superior': -1, 'equivalente': 0, 'inferior': 1}
LOCKED_STATES = ('completada', 'archivada')


_geo_cache: dict[str, dict[str, Any]] = {}
_GEO_TTL = 86400


def parse_date(val: Any) -> date | None:
    if isinstance(val, date):
        return val
    if isinstance(val, str):
        try:
            return datetime.strptime(val.strip(), '%Y-%m-%d').date()
        except (ValueError, TypeError):
            pass
    return None


def csv_safe(val: Any) -> str:
    if val is None:
        return ''
    s = str(val)
    if s and s[0] in ('=', '+', '-', '@', '|'):
        return "'" + s
    return s


def geocode(location: str | None) -> tuple[float | None, float | None]:
    if not location or not location.strip():
        return None, None
    key = location.strip().lower()
    cached = _geo_cache.get(key)
    if cached and (time.time() - cached['ts']) < _GEO_TTL:
        return cached['lat'], cached['lng']
    try:
        q = urllib.parse.quote(f"{location}, Córdoba, Argentina")
        url = f"https://nominatim.openstreetmap.org/search?q={q}&format=json&limit=1"
        req = urllib.request.Request(url, headers={'User-Agent': 'Bienenhaus/1.0'})
        with urllib.request.urlopen(req, timeout=5) as r:
            data = json.loads(r.read().decode())
        if data:
            lat = float(data[0]['lat'])
            lng = float(data[0]['lon'])
            _geo_cache[key] = {'lat': lat, 'lng': lng, 'ts': time.time()}
            return lat, lng
    except Exception:
        pass
    return None, None


class AppraisalService:

    @classmethod
    def build_snapshot(cls, appraisal: Appraisal) -> str:
        comps = Comparable.query.filter_by(appraisal_id=appraisal.id)\
            .order_by(Comparable.numero).all()
        return json.dumps({
            'appraisal': appraisal.to_dict(),
            'comparables': [c.to_dict() for c in comps],
            'config': {'FACTOR_MAP': FACTOR_MAP},
            'generated_at': datetime.now(timezone.utc).isoformat(),
        }, default=str, ensure_ascii=False)

    @classmethod
    def create_version(cls, appraisal: Appraisal) -> AppraisalVersion:
        snapshot = cls.build_snapshot(appraisal)
        last = AppraisalVersion.query.filter_by(appraisal_id=appraisal.id)\
            .order_by(AppraisalVersion.version.desc()).first()
        next_ver = (last.version + 1) if last else 1
        ver = AppraisalVersion(
            appraisal_id=appraisal.id,
            version=next_ver,
            snapshot_json=snapshot,
            created_by=session.get('user_id'),
        )
        db.session.add(ver)
        cls.log_change(appraisal, 'version_creada', f'Versión {next_ver} guardada')
        return ver

    @classmethod
    def assert_editable(cls, appraisal: Appraisal) -> str | None:
        if appraisal.estado in LOCKED_STATES:
            return f'La tasación está {appraisal.estado}. Creá una nueva versión para editarla.'
        return None

    @classmethod
    def calcular_homologacion(cls, comparable: Comparable) -> dict[str, Any] | None:
        if not comparable.superficie_cubierta or not comparable.precio_usd:
            comparable.precio_por_m2 = None
            comparable.coeficiente_ajuste = None
            comparable.valor_m2_ajustado = None
            comparable.valor_ajustado = None
            return None
        if comparable.superficie_cubierta <= 0 or comparable.precio_usd <= 0:
            comparable.precio_por_m2 = None
            comparable.coeficiente_ajuste = None
            comparable.valor_m2_ajustado = None
            comparable.valor_ajustado = None
            return None

        comparable.precio_por_m2 = round(
            comparable.precio_usd / comparable.superficie_cubierta, 2
        )

        total_ajuste = 0.0
        for attr, weight in FACTOR_MAP.items():
            val = getattr(comparable, attr, 'equivalente')
            total_ajuste += _FACTOR_ADJ.get(val, 0) * weight

        coef = round(max(0.70, min(1.30, 1 + total_ajuste)), 4)
        m2_ajustado = round(comparable.precio_por_m2 * coef, 2)
        valor_ajustado = round(m2_ajustado * comparable.superficie_cubierta, 2)

        comparable.coeficiente_ajuste = coef
        comparable.valor_m2_ajustado = m2_ajustado
        comparable.valor_ajustado = valor_ajustado

        return {
            'coeficiente_ajuste': coef,
            'valor_m2_ajustado': m2_ajustado,
            'valor_ajustado': valor_ajustado,
        }

    @classmethod
    def log_change(cls, appraisal: Appraisal, accion: str, descripcion: str = '') -> None:
        log = AppraisalLog(
            appraisal_id=appraisal.id,
            accion=accion,
            descripcion=descripcion,
        )
        db.session.add(log)

    @classmethod
    def auto_calcular_precio_ars(cls, appraisal: Appraisal, comparable: Comparable) -> None:
        if comparable.precio_usd and not comparable.precio_ars and appraisal.tipo_cambio_usd:
            comparable.precio_ars = round(
                comparable.precio_usd * appraisal.tipo_cambio_usd, 2
            )

    @classmethod
    def auto_calc_attrs(cls, appraisal: Appraisal, comparable: Comparable) -> None:
        if appraisal.anio_construccion and comparable.anio_construccion:
            if comparable.comp_antiguedad in ('', None, 'equivalente'):
                diff = comparable.anio_construccion - appraisal.anio_construccion
                if abs(diff) <= 5:
                    comparable.comp_antiguedad = 'equivalente'
                elif diff > 5:
                    comparable.comp_antiguedad = 'superior'
                else:
                    comparable.comp_antiguedad = 'inferior'

        if comparable.comp_estacionamiento in ('', None, 'equivalente'):
            a_garage = bool(appraisal.tiene_garage)
            c_garage = bool(comparable.tiene_garage)
            if a_garage != c_garage:
                comparable.comp_estacionamiento = 'superior' if c_garage else 'inferior'
            else:
                comparable.comp_estacionamiento = 'equivalente'

        if appraisal.dormitorios and comparable.dormitorios:
            if comparable.comp_habitaciones in ('', None, 'equivalente'):
                if comparable.dormitorios > appraisal.dormitorios:
                    comparable.comp_habitaciones = 'superior'
                elif comparable.dormitorios < appraisal.dormitorios:
                    comparable.comp_habitaciones = 'inferior'
                else:
                    comparable.comp_habitaciones = 'equivalente'

    @classmethod
    def recalcular(cls, appraisal: Appraisal) -> None:
        from sqlalchemy.orm import load_only

        comps = Comparable.query.filter_by(
            appraisal_id=appraisal.id, excluido=False
        ).all()
        excluidos = Comparable.query.filter_by(
            appraisal_id=appraisal.id, excluido=True
        ).count()

        if not comps:
            appraisal.total_comparables = 0
            appraisal.precio_m2_promedio = None
            appraisal.precio_m2_minimo = None
            appraisal.precio_m2_maximo = None
            appraisal.dispersion_pct = None
            appraisal.coeficiente_promedio = None
            appraisal.valor_estimado_usd = None
            appraisal.valor_estimado_ars = None
            appraisal.valor_estimado_uvas = None
            return

        ajustados = []
        coefs = []
        for c in comps:
            cls.auto_calc_attrs(appraisal, c)
            result = cls.calcular_homologacion(c)
            if result:
                coefs.append(result['coeficiente_ajuste'])
                ajustados.append(result['valor_m2_ajustado'])
            else:
                c.coeficiente_ajuste = None
                c.valor_m2_ajustado = None
                c.valor_ajustado = None
            db.session.flush()

        validos = [c for c in comps if c.valor_m2_ajustado is not None]
        if not validos:
            return

        vals = [c.valor_m2_ajustado for c in validos]
        prom = sum(vals) / len(vals)
        mini = min(vals)
        maxi = max(vals)
        dispersion = (
            round(statistics.stdev(vals) / prom * 100, 1)
            if len(vals) > 1 and prom else 0
        )
        coef_prom = round(sum(coefs) / len(coefs), 4) if coefs else 0

        appraisal.total_comparables = Comparable.query.filter_by(
            appraisal_id=appraisal.id
        ).count()
        appraisal.precio_m2_promedio = round(prom, 2)
        appraisal.precio_m2_minimo = round(mini, 2)
        appraisal.precio_m2_maximo = round(maxi, 2)
        appraisal.dispersion_pct = dispersion
        appraisal.coeficiente_promedio = coef_prom

        sc = appraisal.superficie_cubierta
        if sc:
            appraisal.valor_estimado_usd = round(sc * prom, 2)
            tc = appraisal.tipo_cambio_usd or 1
            appraisal.valor_estimado_ars = round(appraisal.valor_estimado_usd * tc, 2)
            uva = appraisal.valor_uva or 1
            appraisal.valor_estimado_uvas = round(
                appraisal.valor_estimado_ars / uva, 2
            )

    @classmethod
    def notify_client_if_completed(cls, appraisal: Appraisal) -> None:
        if not appraisal.appraisal_request_id:
            return
        req = db.session.get(AppraisalRequest, appraisal.appraisal_request_id)
        if not req or not req.email:
            return
        try:
            from email_service import is_configured, send_tasacion_completada
            if not is_configured():
                return
            send_tasacion_completada(
                name=req.name or 'Cliente',
                email=req.email,
                titulo=appraisal.titulo or '',
                valor_estimado_usd=appraisal.valor_estimado_usd or 0,
                property_type=appraisal.tipo_propiedad or '',
                appraisal_id=appraisal.id,
            )
        except Exception as e:
            logger.warning(
                'Error notificando cliente tasación #%d: %s',
                appraisal.id, e,
            )

    @classmethod
    def extract_url(cls, url: str) -> dict[str, Any]:
        safe_url, err = _validate_url(url)
        if not safe_url:
            return {'_error': err}

        result, error = extract_property(safe_url)
        if result:
            return result

        friendly = error or ''
        if 'no contiene un listing' in friendly:
            friendly = 'La URL no corresponde a un anuncio válido. Verificá que sea la página de una propiedad publicada (no una búsqueda ni una página de error).'
        elif 'bloqueó' in friendly:
            friendly = 'El portal bloqueó el acceso automatizado. Ingresá los datos manualmente.'
        elif 'agotado' in friendly:
            friendly = 'El portal tardó demasiado en responder. Probá de nuevo más tarde o ingresá los datos manualmente.'
        elif 'no soportado' in friendly:
            friendly = 'Portal no soportado. Usá MercadoLibre, ZonaProp o Argenprop.'
        return {
            'link_fuente': safe_url,
            '_error': friendly,
            'precio_usd': None, 'calle': None, 'numero_calle': None,
            'barrio': None, 'localidad': None, 'superficie_cubierta': None,
            'dormitorios': None, 'banios': None, 'anio_construccion': None,
            'tipo_operacion': 'cotizacion', 'tipo_propiedad': None,
            'inmobiliaria': None, 'tiene_garage': None, 'precio_ars': None,
            'superficie_terreno': None,
        }

    @classmethod
    def get_by_id_or_404(cls, aid: int) -> Appraisal:
        appraisal = db.session.get(Appraisal, aid)
        if not appraisal:
            from flask import abort
            abort(404)
        return appraisal

    @classmethod
    def get_by_id_and_tipo(cls, aid: int, tipo: str) -> Appraisal:
        appraisal = db.session.get(Appraisal, aid)
        if not appraisal or appraisal.tipo != tipo:
            from flask import abort
            abort(404)
        return appraisal

    @classmethod
    def list_appraisals(
        cls,
        estado: str = '',
        incluir_archivadas: bool = False,
        page: int = 1,
        per_page: int = 20,
        search: str = '',
        tipo: str = 'acm',
    ) -> dict[str, Any]:
        from sqlalchemy.orm import load_only, joinedload

        per_page = min(max(per_page, 1), 100)
        list_cols = [
            Appraisal.id, Appraisal.titulo, Appraisal.estado,
            Appraisal.solicitante, Appraisal.tipo_propiedad,
            Appraisal.barrio, Appraisal.superficie_cubierta,
            Appraisal.dormitorios, Appraisal.banios,
            Appraisal.valor_estimado_usd, Appraisal.total_comparables,
            Appraisal.updated_at, Appraisal.assigned_agent_id,
            Appraisal.priority,
        ]
        q = Appraisal.query.options(load_only(*list_cols), joinedload(Appraisal.agent))
        q = q.filter(Appraisal.tipo == tipo)
        if estado:
            q = q.filter(Appraisal.estado == estado)
        if not incluir_archivadas:
            q = q.filter(Appraisal.estado != 'archivada')
        if search:
            like = f'%{search}%'
            q = q.filter(
                db.or_(
                    Appraisal.titulo.ilike(like),
                    Appraisal.solicitante.ilike(like),
                    Appraisal.direccion.ilike(like),
                    Appraisal.barrio.ilike(like),
                    Appraisal.localidad.ilike(like),
                )
            )
        q = q.order_by(Appraisal.updated_at.desc())
        pagination = q.paginate(page=page, per_page=per_page, error_out=False)

        def _light_dict(a: Appraisal) -> dict[str, Any]:
            agent_name = f'{a.agent.name} {a.agent.last}' if a.agent else None
            return {
                'id': a.id, 'titulo': a.titulo, 'estado': a.estado,
                'solicitante': a.solicitante, 'tipo_propiedad': a.tipo_propiedad,
                'barrio': a.barrio, 'superficie_cubierta': a.superficie_cubierta,
                'dormitorios': a.dormitorios, 'banios': a.banios,
                'valor_estimado_usd': a.valor_estimado_usd,
                'total_comparables': a.total_comparables,
                'updated_at': str(a.updated_at) if a.updated_at else None,
                'assigned_agent_id': a.assigned_agent_id,
                'assigned_agent_name': agent_name,
                'priority': a.priority,
            }

        return {
            'data': [_light_dict(a) for a in pagination.items],
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_prev': pagination.has_prev,
            'has_next': pagination.has_next,
        }

    @classmethod
    def create(cls, data: dict[str, Any], tipo: str = 'acm') -> Appraisal:
        if not data.get('solicitante') and not data.get('titulo'):
            raise ValueError('Ingresá al menos un título o un solicitante.')

        ft = data.get('fecha_tasacion')
        data['fecha_tasacion'] = parse_date(ft) if ft else date.today()

        appraisal = Appraisal.from_dict(data)
        appraisal.tipo = tipo
        db.session.add(appraisal)
        db.session.flush()
        cls.log_change(
            appraisal, 'creada',
            f'Tasación creada por {data.get("solicitante", "—")}',
        )
        from services.tasacion_sync import TasacionSync
        TasacionSync.sync_create(appraisal)
        db.session.commit()
        return appraisal

    @classmethod
    def create_from_request(cls, rid: int) -> dict[str, Any]:
        req = db.session.get(AppraisalRequest, rid)
        if not req:
            from flask import abort
            abort(404)

        exists = Appraisal.query.filter_by(appraisal_request_id=rid).first()
        if exists:
            return {'appraisal': exists.to_dict(), 'existing': True}

        destino_map = {
            'vender': 'venta', 'particular': 'venta',
            'judicial': 'seguro', 'alquiler': 'cotizacion',
            'sucesion': 'venta',
        }
        destino = destino_map.get(req.motivo, 'venta')
        if req.motivo and req.motivo not in destino_map:
            logger.warning(
                'Motivo de solicitud #%d desconocido: "%s", default a venta',
                rid, req.motivo,
            )

        titulo = f'Tasación - {req.name}'
        if req.property_type:
            titulo += f' - {req.property_type}'

        try:
            appraisal = Appraisal(
                titulo=titulo, estado='borrador', destino=destino,
                solicitante=req.name, telefono=req.phone,
                tipo_propiedad=req.property_type or 'casa',
                localidad=req.city or '', direccion=req.address or '',
                observaciones=req.comments or '', fecha_tasacion=date.today(),
                appraisal_request_id=rid,
            )
            db.session.add(appraisal)
            db.session.flush()
            cls.log_change(
                appraisal, 'creada',
                f'Tasación creada desde solicitud #{rid} ({req.name})',
            )
            req.status = 'completado'
            db.session.commit()
            return {'appraisal': appraisal.to_dict(), 'existing': False}
        except Exception:
            from sqlalchemy.exc import IntegrityError
            db.session.rollback()
            existing = Appraisal.query.filter_by(appraisal_request_id=rid).first()
            if existing:
                return {'appraisal': existing.to_dict(), 'existing': True}
            raise

    @classmethod
    def update(cls, aid: int, data: dict[str, Any], tipo: str = 'acm') -> Appraisal:
        appraisal = cls.get_by_id_and_tipo(aid, tipo)
        err = cls.assert_editable(appraisal)
        if err:
            raise ValueError(err)
        if 'fecha_tasacion' in data:
            data['fecha_tasacion'] = parse_date(data['fecha_tasacion'])
        old_estado = appraisal.estado
        appraisal.update_from_dict(data)
        for c in appraisal.comparables:
            cls.auto_calcular_precio_ars(appraisal, c)
        cls.recalcular(appraisal)
        if old_estado != appraisal.estado:
            cls.log_change(
                appraisal, 'estado',
                f'Cambió de {old_estado} a {appraisal.estado}',
            )
        cls.log_change(appraisal, 'actualizada', 'Datos actualizados')
        from services.tasacion_sync import TasacionSync
        TasacionSync.sync_update(appraisal)
        db.session.commit()
        if old_estado != appraisal.estado and appraisal.estado == 'completada':
            cls.notify_client_if_completed(appraisal)
        return appraisal

    @classmethod
    def archive(cls, aid: int, tipo: str = 'acm') -> Appraisal:
        appraisal = cls.get_by_id_and_tipo(aid, tipo)
        appraisal.estado = 'archivada'
        cls.log_change(appraisal, 'archivada', 'Tasación archivada')
        from services.tasacion_sync import TasacionSync
        TasacionSync.sync_update(appraisal)
        db.session.commit()
        return appraisal

    @classmethod
    def restore(cls, aid: int, tipo: str = 'acm') -> Appraisal:
        appraisal = cls.get_by_id_and_tipo(aid, tipo)
        if appraisal.estado != 'archivada':
            raise ValueError('La tasación no está archivada.')
        appraisal.estado = 'borrador'
        cls.log_change(appraisal, 'restaurada', 'Tasación restaurada de archivo')
        from services.tasacion_sync import TasacionSync
        TasacionSync.sync_update(appraisal)
        db.session.commit()
        return appraisal

    @classmethod
    def delete(cls, aid: int, tipo: str = 'acm') -> None:
        appraisal = cls.get_by_id_and_tipo(aid, tipo)
        cls.log_change(
            appraisal, 'eliminada', 'Tasación eliminada permanentemente',
        )
        from services.tasacion_sync import TasacionSync
        TasacionSync.sync_delete(aid)
        db.session.delete(appraisal)
        db.session.commit()

    @classmethod
    def completar(cls, aid: int, tipo: str = 'acm') -> Appraisal:
        appraisal = cls.get_by_id_and_tipo(aid, tipo)
        appraisal.estado = 'completada'
        cls.recalcular(appraisal)
        cls.create_version(appraisal)
        cls.log_change(appraisal, 'completada', 'Valuación finalizada')
        from services.tasacion_sync import TasacionSync
        TasacionSync.sync_update(appraisal)
        db.session.commit()
        cls.notify_client_if_completed(appraisal)
        return appraisal

    @classmethod
    def stats(cls, tipo: str = 'acm') -> dict[str, int]:
        q = Appraisal.query.filter(Appraisal.tipo == tipo)
        total = q.count()
        borradores = q.filter_by(estado='borrador').count()
        en_proceso = q.filter_by(estado='en_proceso').count()
        completadas = q.filter_by(estado='completada').count()
        archivadas = q.filter_by(estado='archivada').count()
        return {
            'total': total,
            'borradores': borradores,
            'en_proceso': en_proceso,
            'completadas': completadas,
            'archivadas': archivadas,
        }

    @classmethod
    def add_comparable(cls, aid: int, data: dict[str, Any], tipo: str = 'acm') -> Comparable:
        appraisal = cls.get_by_id_and_tipo(aid, tipo)
        err = cls.assert_editable(appraisal)
        if err:
            raise ValueError(err)
        max_num = db.session.query(db.func.max(Comparable.numero)).filter(
            Comparable.appraisal_id == aid,
        ).scalar() or 0
        comp = Comparable(appraisal_id=aid, numero=max_num + 1)
        comp.update_from_dict(data)
        cls.auto_calcular_precio_ars(appraisal, comp)
        db.session.add(comp)
        cls.recalcular(appraisal)
        cls.log_change(
            appraisal, 'comparable_agregado',
            f'C{comp.numero}: {data.get("calle","")} {data.get("numero_calle","")} — USD {data.get("precio_usd",0):,.2f}',
        )
        db.session.commit()
        return comp

    @classmethod
    def update_comparable(cls, aid: int, cid: int, data: dict[str, Any], tipo: str = 'acm') -> Comparable:
        appraisal = cls.get_by_id_and_tipo(aid, tipo)
        err = cls.assert_editable(appraisal)
        if err:
            raise ValueError(err)
        comp = Comparable.query.filter_by(id=cid, appraisal_id=aid).first_or_404()
        comp.update_from_dict(data)
        cls.auto_calcular_precio_ars(appraisal, comp)
        cls.recalcular(appraisal)
        cls.log_change(
            appraisal, 'comparable_editado',
            f'C{comp.numero} actualizado',
        )
        db.session.commit()
        return comp

    @classmethod
    def delete_comparable(cls, aid: int, cid: int, tipo: str = 'acm') -> None:
        appraisal = cls.get_by_id_and_tipo(aid, tipo)
        err = cls.assert_editable(appraisal)
        if err:
            raise ValueError(err)
        comp = Comparable.query.filter_by(id=cid, appraisal_id=aid).first_or_404()
        num = comp.numero
        db.session.delete(comp)
        cls.recalcular(appraisal)
        restantes = Comparable.query.filter_by(appraisal_id=aid).order_by(
            Comparable.numero,
        ).all()
        for i, c in enumerate(restantes, 1):
            c.numero = i
        cls.log_change(
            appraisal, 'comparable_eliminado',
            f'C{num} eliminado',
        )
        db.session.commit()

    @classmethod
    def toggle_comparable_exclusion(cls, aid: int, cid: int, tipo: str = 'acm') -> bool:
        appraisal = cls.get_by_id_and_tipo(aid, tipo)
        err = cls.assert_editable(appraisal)
        if err:
            raise ValueError(err)
        comp = Comparable.query.filter_by(id=cid, appraisal_id=aid).first_or_404()
        comp.excluido = not comp.excluido
        cls.recalcular(appraisal)
        cls.log_change(
            appraisal,
            'comparable_excluido' if comp.excluido else 'comparable_incluido',
            f'C{comp.numero} {"excluido" if comp.excluido else "incluido"}',
        )
        db.session.commit()
        return comp.excluido

    @classmethod
    def preview_homologacion(cls, aid: int, data: dict[str, Any], tipo: str = 'acm') -> dict[str, Any]:
        appraisal = cls.get_by_id_and_tipo(aid, tipo)
        comp = Comparable(appraisal_id=aid)
        comp.update_from_dict(data)
        cls.auto_calc_attrs(appraisal, comp)
        result = cls.calcular_homologacion(comp)
        if result:
            return result
        return {
            'coeficiente_ajuste': 1.0,
            'valor_m2_ajustado': None,
            'valor_ajustado': None,
        }

    @classmethod
    def create_new_version(cls, aid: int, tipo: str = 'acm') -> Appraisal:
        appraisal = cls.get_by_id_and_tipo(aid, tipo)
        if appraisal.estado not in LOCKED_STATES:
            raise ValueError(
                'La tasación no está bloqueada. Solo completada/archivada necesita nueva versión.',
            )
        cls.create_version(appraisal)
        appraisal.estado = 'en_proceso'
        cls.log_change(
            appraisal, 'nueva_version',
            f'Nueva versión creada — estado cambiado a en_proceso',
        )
        db.session.commit()
        return appraisal

    @classmethod
    def export_csv(cls, aid: int, tipo: str = 'acm') -> str:
        appraisal = cls.get_by_id_and_tipo(aid, tipo)
        cls.recalcular(appraisal)
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(['=== TASACIÓN ==='])
        w.writerow(['Título', csv_safe(appraisal.titulo)])
        w.writerow(['Solicitante', csv_safe(appraisal.solicitante)])
        w.writerow(['Dirección', csv_safe(appraisal.direccion)])
        w.writerow(['Barrio', csv_safe(appraisal.barrio)])
        w.writerow(['Localidad', csv_safe(appraisal.localidad)])
        w.writerow(['Tipo propiedad', csv_safe(appraisal.tipo_propiedad)])
        w.writerow(['Sup. cubierta m²', appraisal.superficie_cubierta])
        w.writerow(['Sup. terreno m²', appraisal.superficie_terreno])
        w.writerow(['Dormitorios', appraisal.dormitorios])
        w.writerow(['Baños', appraisal.banios])
        w.writerow(['Año constr.', appraisal.anio_construccion])
        w.writerow(['T/C USD', appraisal.tipo_cambio_usd])
        w.writerow(['Valor UVA', appraisal.valor_uva])
        w.writerow(['Estado', csv_safe(appraisal.estado)])
        w.writerow([''])
        w.writerow(['=== RESULTADOS ==='])
        w.writerow(['Valor estimado USD', appraisal.valor_estimado_usd])
        w.writerow(['Valor estimado ARS', appraisal.valor_estimado_ars])
        w.writerow(['Valor estimado UVAs', appraisal.valor_estimado_uvas])
        w.writerow(['Precio/m² promedio', appraisal.precio_m2_promedio])
        w.writerow(['Precio/m² mínimo', appraisal.precio_m2_minimo])
        w.writerow(['Precio/m² máximo', appraisal.precio_m2_maximo])
        w.writerow(['Dispersión %', appraisal.dispersion_pct])
        w.writerow(['Coeficiente promedio', appraisal.coeficiente_promedio])
        w.writerow(['Total comparables', appraisal.total_comparables])
        w.writerow([''])
        w.writerow(['=== COMPARABLES ==='])
        w.writerow([
            'N°', 'Calle', 'Número', 'Barrio', 'Localidad', 'Tipo', 'Operación',
            'Precio USD', 'Sup. cubierta', 'Sup. terreno', 'Dormitorios', 'Baños',
            'Garage', 'Año constr.', 'Precio/m²', 'Coef.', '$/m² Ajustado',
            'Antigüedad', 'Estacionamiento', 'Habitaciones', 'Ubicación',
            'Mantenimiento', 'Comodidades', 'Orientación', 'Vistas',
            'Nivel de piso', 'Link',
        ])
        for c in appraisal.comparables:
            w.writerow([
                c.numero, csv_safe(c.calle), csv_safe(c.numero_calle),
                csv_safe(c.barrio), csv_safe(c.localidad),
                csv_safe(c.tipo_propiedad), csv_safe(c.tipo_operacion),
                c.precio_usd, c.superficie_cubierta, c.superficie_terreno,
                c.dormitorios, c.banios, c.tiene_garage, c.anio_construccion,
                c.precio_por_m2, c.coeficiente_ajuste, c.valor_m2_ajustado,
                csv_safe(c.comp_antiguedad), csv_safe(c.comp_estacionamiento),
                csv_safe(c.comp_habitaciones), csv_safe(c.comp_ubicacion),
                csv_safe(c.comp_estado_mantenimiento), csv_safe(c.comp_comodidades),
                csv_safe(c.comp_orientacion), csv_safe(c.comp_vistas),
                csv_safe(c.comp_nivel_piso), csv_safe(c.link_fuente),
            ])
        csv_str = buf.getvalue()
        buf.close()
        return csv_str
