from __future__ import annotations
import json
from typing import Any, Self
from datetime import datetime, timezone, date
from extensions import db


class Appraisal(db.Model):
    __tablename__ = 'appraisals'
    __table_args__ = (
        db.Index('ix_appraisals_estado_updated', 'estado', 'updated_at'),
        db.Index('ix_appraisals_tipo_estado', 'tipo', 'estado'),
        db.UniqueConstraint('appraisal_request_id', name='uq_appraisal_request'),
        {'extend_existing': True},
    )

    id = db.Column(db.Integer, primary_key=True)

    tipo = db.Column(db.String(20), nullable=False, server_default='acm')

    titulo          = db.Column(db.String(200), default='')
    estado          = db.Column(db.String(20), default='borrador')
    fecha_tasacion  = db.Column(db.Date, nullable=True)
    destino         = db.Column(db.String(50), default='venta')

    solicitante     = db.Column(db.String(200), default='')
    telefono        = db.Column(db.String(100), default='')

    tipo_propiedad      = db.Column(db.String(50), default='casa')
    direccion           = db.Column(db.String(200), default='')
    barrio              = db.Column(db.String(100), default='')
    localidad           = db.Column(db.String(100), default='')
    provincia           = db.Column(db.String(100), default='Córdoba')
    anio_construccion   = db.Column(db.Integer, default=0)
    superficie_terreno  = db.Column(db.Float, default=0)
    superficie_cubierta = db.Column(db.Float, default=0)
    dormitorios         = db.Column(db.Integer, default=0)
    banios              = db.Column(db.Integer, default=0)

    tipo_construccion       = db.Column(db.String(100), default='')
    tipo_techo              = db.Column(db.String(100), default='')
    orientacion             = db.Column(db.String(50), default='')
    luminosidad             = db.Column(db.String(20), default='media')
    calidad_constructiva    = db.Column(db.String(20), default='media')
    calidad_mantenimiento   = db.Column(db.String(20), default='media')
    detalles_terminacion    = db.Column(db.String(20), default='medio')
    estado_conservacion     = db.Column(db.String(20), default='bueno')

    estacionamiento    = db.Column(db.String(100), default='')
    calefaccion        = db.Column(db.String(50), default='')
    agua_caliente      = db.Column(db.String(50), default='')
    aire_acondicionado = db.Column(db.String(50), default='')

    vida_remanente              = db.Column(db.Integer, default=0)
    impuesto_inmobiliario_mensual = db.Column(db.Float, default=0)
    tipo_cambio_usd             = db.Column(db.Float, default=0)
    valor_uva                   = db.Column(db.Float, default=0)

    tiene_cocina     = db.Column(db.Boolean, default=False)
    tiene_comedor    = db.Column(db.Boolean, default=False)
    tiene_living     = db.Column(db.Boolean, default=False)
    tiene_patio      = db.Column(db.Boolean, default=False)
    tiene_terraza    = db.Column(db.Boolean, default=False)
    tiene_balcon     = db.Column(db.Boolean, default=False)
    tiene_lavadero   = db.Column(db.Boolean, default=False)
    tiene_escritorio = db.Column(db.Boolean, default=False)
    tiene_suite      = db.Column(db.Boolean, default=False)
    tiene_playroom   = db.Column(db.Boolean, default=False)
    tiene_asador     = db.Column(db.Boolean, default=False)
    tiene_piscina    = db.Column(db.Boolean, default=False)
    tiene_garage     = db.Column(db.Boolean, default=False)

    tiene_electricidad_publica  = db.Column(db.Boolean, default=False)
    tiene_gas_publico           = db.Column(db.Boolean, default=False)
    tiene_telefono_publico      = db.Column(db.Boolean, default=False)
    tiene_agua_publica          = db.Column(db.Boolean, default=False)
    tiene_cloaca_publica        = db.Column(db.Boolean, default=False)
    tiene_desague_pluvial       = db.Column(db.Boolean, default=False)

    tipo_barrio                = db.Column(db.String(30), default='urbano')
    nivel_construccion         = db.Column(db.String(30), default='')
    indice_crecimiento         = db.Column(db.String(30), default='estable')
    vigilancia_barrio          = db.Column(db.Boolean, default=False)
    valores_propiedad          = db.Column(db.String(30), default='estable')
    demanda_oferta             = db.Column(db.String(30), default='equilibrio')
    tiempo_comercializacion    = db.Column(db.String(30), default='')
    uso_residencial_pct        = db.Column(db.Float, default=0)
    uso_comercial_pct          = db.Column(db.Float, default=0)
    uso_industrial_pct         = db.Column(db.Float, default=0)
    cambios_uso_terreno        = db.Column(db.String(30), default='improbable')
    facilidades_estacionamiento = db.Column(db.String(200), default='')
    tipologias_predominantes   = db.Column(db.String(200), default='')
    calidad_constructiva_barrio = db.Column(db.String(20), default='media')
    construccion_altura        = db.Column(db.String(100), default='')
    uso_comercial_descripcion  = db.Column(db.String(200), default='')
    uso_industrial_descripcion = db.Column(db.String(200), default='')
    nivel_socioeconomico       = db.Column(db.String(30), default='medio')

    valor_estimado_usd  = db.Column(db.Float, nullable=True)
    valor_estimado_ars  = db.Column(db.Float, nullable=True)
    valor_estimado_uvas = db.Column(db.Float, nullable=True)
    precio_m2_promedio  = db.Column(db.Float, nullable=True)
    precio_m2_minimo    = db.Column(db.Float, nullable=True)
    precio_m2_maximo    = db.Column(db.Float, nullable=True)
    dispersion_pct      = db.Column(db.Float, nullable=True)
    coeficiente_promedio = db.Column(db.Float, nullable=True)
    total_comparables    = db.Column(db.Integer, default=0)

    observaciones = db.Column(db.Text, default='')

    appraisal_request_id = db.Column(db.Integer, db.ForeignKey('appraisal_requests.id'), nullable=True)
    assigned_agent_id    = db.Column(db.Integer, db.ForeignKey('agents.id', ondelete='SET NULL'), nullable=True)
    priority             = db.Column(db.String(20), default='media')

    agent = db.relationship('Agent', backref=db.backref('appraisals', lazy='dynamic'))

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
                            onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    comparables = db.relationship('Comparable', backref='appraisal', lazy='selectin',
                                  cascade='all, delete-orphan',
                                  order_by='Comparable.numero')
    appraisal_request = db.relationship('AppraisalRequest', backref=db.backref('appraisal', uselist=False),
                                        foreign_keys=[appraisal_request_id])

    def to_dict(self) -> dict[str, Any]:
        cols = [c.name for c in self.__table__.columns]
        d: dict[str, Any] = {}
        for c in cols:
            v = getattr(self, c)
            if isinstance(v, (datetime, date)):
                d[c] = str(v) if v else None
            else:
                d[c] = v
        d['comparables'] = [c.to_dict() for c in self.comparables]
        d['assigned_agent_name'] = self.agent.name + ' ' + self.agent.last if self.agent else None
        d['comment_count'] = len(self.appr_comments) if hasattr(self, 'appr_comments') else 0
        d['file_count'] = len(self.appr_files) if hasattr(self, 'appr_files') else 0
        d['timeline_count'] = len(self.appr_timeline) if hasattr(self, 'appr_timeline') else 0
        return d

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Self:
        kwargs = {k: data.get(k) for k in cls.__table__.columns.keys()
                  if k in data and k not in ('id', 'created_at', 'updated_at')}
        return cls(**kwargs)

    APPRAISAL_EDITABLE = {
        'titulo', 'estado', 'fecha_tasacion', 'destino',
        'solicitante', 'telefono',
        'tipo_propiedad', 'direccion', 'barrio', 'localidad', 'provincia',
        'anio_construccion', 'superficie_terreno', 'superficie_cubierta',
        'dormitorios', 'banios',
        'tipo_construccion', 'tipo_techo', 'orientacion', 'luminosidad',
        'calidad_constructiva', 'calidad_mantenimiento', 'detalles_terminacion',
        'estado_conservacion',
        'estacionamiento', 'calefaccion', 'agua_caliente', 'aire_acondicionado',
        'vida_remanente', 'impuesto_inmobiliario_mensual', 'tipo_cambio_usd',
        'valor_uva',
        'tiene_cocina', 'tiene_comedor', 'tiene_living', 'tiene_patio',
        'tiene_terraza', 'tiene_balcon', 'tiene_lavadero', 'tiene_escritorio',
        'tiene_suite', 'tiene_playroom', 'tiene_asador', 'tiene_piscina',
        'tiene_garage',
        'tiene_electricidad_publica', 'tiene_gas_publico',
        'tiene_telefono_publico', 'tiene_agua_publica', 'tiene_cloaca_publica',
        'tiene_desague_pluvial',
        'tipo_barrio', 'nivel_construccion', 'indice_crecimiento',
        'vigilancia_barrio', 'valores_propiedad', 'demanda_oferta',
        'tiempo_comercializacion', 'uso_residencial_pct', 'uso_comercial_pct',
        'uso_industrial_pct', 'cambios_uso_terreno',
        'facilidades_estacionamiento', 'tipologias_predominantes',
        'calidad_constructiva_barrio', 'construccion_altura',
        'uso_comercial_descripcion', 'uso_industrial_descripcion',
        'nivel_socioeconomico', 'observaciones', 'assigned_agent_id', 'priority',
    }

    def update_from_dict(self, data: dict[str, Any]) -> None:
        for k, v in data.items():
            if k in self.APPRAISAL_EDITABLE:
                setattr(self, k, v)


class Comparable(db.Model):
    __tablename__ = 'comparables'
    __table_args__ = (
        db.Index('ix_comparables_appraisal_numero', 'appraisal_id', 'numero'),
        {'extend_existing': True},
    )

    id               = db.Column(db.Integer, primary_key=True)
    appraisal_id     = db.Column(db.Integer, db.ForeignKey('appraisals.id'), nullable=False)
    numero           = db.Column(db.Integer, default=1)
    tipo_operacion   = db.Column(db.String(20), default='cotizacion')
    precio_usd       = db.Column(db.Float, default=0)
    precio_ars       = db.Column(db.Float, default=0)
    calle            = db.Column(db.String(200), default='')
    numero_calle     = db.Column(db.String(50), default='')
    piso_depto       = db.Column(db.String(50), default='')
    barrio           = db.Column(db.String(100), default='')
    localidad        = db.Column(db.String(100), default='')
    dias_en_mercado  = db.Column(db.Integer, default=0)
    tipo_propiedad   = db.Column(db.String(50), default='')
    superficie_cubierta = db.Column(db.Float, default=0)
    superficie_terreno  = db.Column(db.Float, default=0)
    tipo_construccion   = db.Column(db.String(100), default='')
    anio_construccion   = db.Column(db.Integer, default=0)
    fecha_referencia    = db.Column(db.Date, nullable=True)
    precio_por_m2       = db.Column(db.Float, default=0)
    link_fuente         = db.Column(db.Text, default='')
    observaciones       = db.Column(db.Text, default='')
    inmobiliaria        = db.Column(db.String(200), default='')
    telefono_inmobiliaria = db.Column(db.String(100), default='')

    dormitorios         = db.Column(db.Integer, default=0)
    banios              = db.Column(db.Float, default=0)
    tiene_garage        = db.Column(db.Boolean, default=False)

    comp_antiguedad           = db.Column(db.String(20), default='equivalente')
    comp_estado_mantenimiento = db.Column(db.String(20), default='equivalente')
    comp_estacionamiento      = db.Column(db.String(20), default='equivalente')
    comp_ubicacion            = db.Column(db.String(20), default='equivalente')
    comp_comodidades          = db.Column(db.String(20), default='equivalente')
    comp_habitaciones         = db.Column(db.String(20), default='equivalente')
    comp_orientacion          = db.Column(db.String(20), default='equivalente')
    comp_vistas               = db.Column(db.String(20), default='equivalente')
    comp_nivel_piso           = db.Column(db.String(20), default='equivalente')
    excluido                  = db.Column(db.Boolean, default=False)

    coeficiente_ajuste   = db.Column(db.Float, default=1.0)
    valor_m2_ajustado    = db.Column(db.Float, nullable=True)
    valor_ajustado       = db.Column(db.Float, nullable=True)

    def to_dict(self) -> dict[str, Any]:
        cols = [c.name for c in self.__table__.columns if c.name != 'appraisal_id']
        d: dict[str, Any] = {}
        for c in cols:
            v = getattr(self, c)
            if isinstance(v, (datetime, date)):
                d[c] = str(v) if v else None
            else:
                d[c] = v
        coef = self.coeficiente_ajuste or 1.0
        m2 = self.valor_m2_ajustado
        if self.precio_por_m2 and coef and not m2:
            m2 = round(self.precio_por_m2 * coef, 2)
        if m2:
            d['rango_min'] = round(m2 * 0.90, 2)
            d['rango_prom'] = round(m2, 2)
            d['rango_max'] = round(m2 * 1.10, 2)
        return d

    COMPARABLE_EDITABLE = {
        'numero', 'tipo_operacion', 'precio_usd', 'precio_ars',
        'calle', 'numero_calle', 'piso_depto', 'barrio', 'localidad',
        'dias_en_mercado', 'tipo_propiedad', 'superficie_cubierta',
        'superficie_terreno', 'tipo_construccion', 'anio_construccion',
        'fecha_referencia', 'link_fuente', 'observaciones',
        'inmobiliaria', 'telefono_inmobiliaria',
        'dormitorios', 'banios', 'tiene_garage',
        'comp_antiguedad', 'comp_estado_mantenimiento', 'comp_estacionamiento',
        'comp_ubicacion', 'comp_comodidades', 'comp_habitaciones',
        'comp_orientacion', 'comp_vistas', 'comp_nivel_piso',
    }

    def update_from_dict(self, data: dict[str, Any]) -> None:
        for k, v in data.items():
            if k in self.COMPARABLE_EDITABLE:
                setattr(self, k, v)


class AppraisalLog(db.Model):
    __tablename__ = 'appraisal_logs'
    __table_args__ = ({'extend_existing': True},)

    id           = db.Column(db.Integer, primary_key=True)
    appraisal_id = db.Column(db.Integer, db.ForeignKey('appraisals.id'), nullable=False)
    accion       = db.Column(db.String(50), nullable=False)
    descripcion  = db.Column(db.Text, default='')
    created_at   = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    appraisal = db.relationship('Appraisal', backref=db.backref('logs', cascade='all, delete-orphan'))

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'appraisal_id': self.appraisal_id,
            'accion': self.accion,
            'descripcion': self.descripcion,
            'created_at': str(self.created_at) if self.created_at else None,
        }


class AppraisalVersion(db.Model):
    __tablename__ = 'appraisal_versions'
    __table_args__ = ({'extend_existing': True},)

    id            = db.Column(db.Integer, primary_key=True)
    appraisal_id  = db.Column(db.Integer, db.ForeignKey('appraisals.id'), nullable=False)
    version       = db.Column(db.Integer, nullable=False, default=1)
    snapshot_json = db.Column(db.Text, nullable=False)
    pdf_path      = db.Column(db.String(500), nullable=True)
    created_at    = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    created_by    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    appraisal = db.relationship('Appraisal', backref=db.backref('versions', cascade='all, delete-orphan',
                                order_by='AppraisalVersion.version.desc()'))
    creator   = db.relationship('User', backref=db.backref('appraisal_versions', lazy='dynamic'))

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'appraisal_id': self.appraisal_id,
            'version': self.version,
            'created_at': str(self.created_at) if self.created_at else None,
            'created_by': self.creator.username if self.creator else None,
            'has_snapshot': bool(self.snapshot_json),
            'pdf_path': self.pdf_path,
        }

    def get_snapshot(self) -> dict[str, Any] | None:
        return json.loads(self.snapshot_json) if self.snapshot_json else None


class Empresa(db.Model):
    __tablename__ = 'empresa'
    __table_args__ = ({'extend_existing': True},)

    id = db.Column(db.Integer, primary_key=True)
    nombre          = db.Column(db.String(200), default='')
    subtitulo       = db.Column(db.String(200), default='')
    tasador_nombre  = db.Column(db.String(200), default='')
    tasador_matricula = db.Column(db.String(100), default='')
    telefono        = db.Column(db.String(100), default='')
    email           = db.Column(db.String(200), default='')
    direccion       = db.Column(db.String(200), default='')
    color_principal = db.Column(db.String(7), default='#20b8ab')
    logo_url        = db.Column(db.String(500), default='')
    logo_secundario_url = db.Column(db.String(500), default='')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
                            onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    def to_dict(self) -> dict[str, Any]:
        return {c.name: getattr(self, c.name) for c in self.__table__.columns
                if not isinstance(getattr(self, c.name), (datetime, date))
                or str(getattr(self, c.name))}


class AppraisalRequest(db.Model):
    __tablename__ = 'appraisal_requests'
    __table_args__ = ({'extend_existing': True},)

    id             = db.Column(db.Integer, primary_key=True)
    name           = db.Column(db.String(200), nullable=False)
    phone          = db.Column(db.String(100), default='')
    email          = db.Column(db.String(200), default='')
    property_type  = db.Column(db.String(50), default='')
    motivo         = db.Column(db.String(100), default='')
    city           = db.Column(db.String(200), default='')
    address        = db.Column(db.String(200), default='')
    comments       = db.Column(db.Text, default='')
    status                = db.Column(db.String(20), default='pendiente')
    email_sent_at         = db.Column(db.DateTime, nullable=True)
    email_delivery_status = db.Column(db.String(20), default='pending')
    created_at            = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    def to_dict(self) -> dict[str, Any]:
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'email': self.email,
            'property_type': self.property_type,
            'motivo': self.motivo,
            'city': self.city,
            'address': self.address,
            'comments': self.comments,
            'status': self.status,
            'email_sent_at': str(self.email_sent_at) if self.email_sent_at else None,
            'email_delivery_status': self.email_delivery_status or 'pending',
            'created_at': str(self.created_at) if self.created_at else None,
            'appraisal_id': self.appraisal.id if self.appraisal else None,
            'appraisal_titulo': self.appraisal.titulo if self.appraisal else None,
        }
