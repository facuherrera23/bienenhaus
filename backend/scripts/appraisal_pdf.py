"""Generación de PDF profesional para informes ACM (tasaciones)."""
import io
import os
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from models import Comparable

EMPRESA = os.getenv('EMPRESA_NOMBRE', 'Bienenhaus')
DIR = os.getenv('EMPRESA_DIR', '')
TEL = os.getenv('EMPRESA_TEL', '')
WIDTH, HEIGHT = A4

MARGIN = 2 * cm


def _styles():
    ss = getSampleStyleSheet()
    ss.add(ParagraphStyle('Title2', parent=ss['Heading1'], fontSize=18, spaceAfter=6, textColor=colors.HexColor('#1a1a2e')))
    ss.add(ParagraphStyle('SubT', parent=ss['Normal'], fontSize=10, textColor=colors.HexColor('#555'), spaceAfter=4))
    ss.add(ParagraphStyle('Section', parent=ss['Heading2'], fontSize=13, spaceBefore=12, spaceAfter=6, textColor=colors.HexColor('#1a1a2e'), borderWidth=0))
    ss.add(ParagraphStyle('Cell', parent=ss['Normal'], fontSize=9, leading=12))
    ss.add(ParagraphStyle('CellB', parent=ss['Normal'], fontSize=9, leading=12, fontName='Helvetica-Bold'))
    ss.add(ParagraphStyle('Value', parent=ss['Normal'], fontSize=11, fontName='Helvetica-Bold', textColor=colors.HexColor('#1a1a2e')))
    ss.add(ParagraphStyle('Small', parent=ss['Normal'], fontSize=8, textColor=colors.HexColor('#777')))
    ss.add(ParagraphStyle('Footer', parent=ss['Normal'], fontSize=7, textColor=colors.HexColor('#aaa'), alignment=TA_CENTER))
    return ss


def _header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(colors.HexColor('#aaa'))
    canvas.drawCentredString(WIDTH / 2, 1 * cm, f'{EMPRESA} — Informe generado el {datetime.now().strftime("%d/%m/%Y %H:%M")}')
    canvas.restoreState()


def _hr():
    return HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#ddd'), spaceAfter=6, spaceBefore=6)


def build_pdf(appraisal) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=MARGIN, bottomMargin=MARGIN,
        leftMargin=MARGIN, rightMargin=MARGIN,
    )
    s = _styles()
    elements = []

    # ── Header ──
    elements.append(Paragraph(f'{EMPRESA}', s['Title2']))
    elements.append(Paragraph('Informe de Tasación — ACM', s['SubT']))
    elements.append(_hr())

    # ── Datos del informe ──
    info_data = [
        ['Título:', appraisal.titulo or '—'],
        ['Fecha:', (appraisal.fecha_tasacion or datetime.now()).strftime('%d/%m/%Y')],
        ['Destino:', appraisal.destino or '—'],
        ['Solicitante:', appraisal.solicitante or '—'],
    ]
    t = Table(info_data, colWidths=[4 * cm, 10 * cm])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#555')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 6))

    # ── Propiedad tasada ──
    elements.append(Paragraph('Propiedad Tasada', s['Section']))
    prop_data = [
        ['Dirección:', f'{appraisal.direccion or "—"}, {appraisal.barrio or ""}, {appraisal.localidad or ""}'],
        ['Tipo:', appraisal.tipo_propiedad or '—'],
        ['Superficie cubierta:', f'{appraisal.superficie_cubierta or 0:.1f} m²' if appraisal.superficie_cubierta else '—'],
        ['Superficie terreno:', f'{appraisal.superficie_terreno or 0:.1f} m²' if appraisal.superficie_terreno else '—'],
        ['Dormitorios:', str(appraisal.dormitorios or 0)],
        ['Baños:', str(appraisal.banios or 0)],
        ['Año construcción:', str(appraisal.anio_construccion or '—')],
        ['Estado conservación:', appraisal.estado_conservacion or '—'],
    ]
    t = Table(prop_data, colWidths=[4.5 * cm, 9.5 * cm])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#555')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 4))

    # ── Características ──
    comodidades = []
    for col in ['tiene_cocina', 'tiene_comedor', 'tiene_living', 'tiene_patio',
                'tiene_terraza', 'tiene_balcon', 'tiene_lavadero', 'tiene_suite',
                'tiene_asador', 'tiene_piscina', 'tiene_garage']:
        if getattr(appraisal, col, False):
            label = col.replace('tiene_', '').replace('_', ' ').title()
            comodidades.append(label)
    if comodidades:
        elements.append(Paragraph(f'<b>Comodidades:</b> {", ".join(comodidades)}', s['Cell']))
        elements.append(Spacer(1, 4))

    servs = []
    for col in ['tiene_electricidad_publica', 'tiene_gas_publico', 'tiene_agua_publica',
                'tiene_cloaca_publica', 'tiene_telefono_publico']:
        if getattr(appraisal, col, False):
            label = col.replace('tiene_', '').replace('_publico', '').replace('_publica', '').replace('_', ' ').title()
            servs.append(label)
    if servs:
        elements.append(Paragraph(f'<b>Servicios:</b> {", ".join(servs)}', s['Cell']))
        elements.append(Spacer(1, 4))

    elements.append(_hr())

    # ── Comparables ──
    comps = Comparable.query.filter_by(appraisal_id=appraisal.id, excluido=False).order_by(Comparable.numero).all()
    if comps:
        elements.append(Paragraph(f'Comparables ({len(comps)})', s['Section']))
        header = ['#', 'Dirección', 'Sup. (m²)', 'Precio USD', '$/m²', 'Coef.', '$/m² Ajust.']
        data = [header]
        for c in comps:
            dire = f'{c.calle or ""} {c.numero_calle or ""}'.strip() or '—'
            pp = f'$ {c.precio_por_m2:,.0f}' if c.precio_por_m2 else '—'
            coef = f'{c.coeficiente_ajuste:.4f}' if c.coeficiente_ajuste else '—'
            aj = f'$ {c.valor_m2_ajustado:,.0f}' if c.valor_m2_ajustado else '—'
            data.append([
                str(c.numero), dire[:30],
                f'{c.superficie_cubierta:.0f}' if c.superficie_cubierta else '—',
                f'$ {c.precio_usd:,.0f}' if c.precio_usd else '—',
                pp, coef, aj,
            ])

        col_w = [0.6 * cm, 5 * cm, 1.8 * cm, 2.2 * cm, 1.8 * cm, 1.5 * cm, 2.2 * cm]
        t = Table(data, colWidths=col_w, repeatRows=1)
        t.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a2e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#ccc')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(t)
    else:
        elements.append(Paragraph('Sin comparables activos.', s['Cell']))

    elements.append(Spacer(1, 8))
    elements.append(_hr())

    # ── Resultados ACM ──
    elements.append(Paragraph('Resultado de la Valuación', s['Section']))
    res_data = [
        ['Precio m² promedio:', f'$ {appraisal.precio_m2_promedio:,.2f}' if appraisal.precio_m2_promedio else '—'],
        ['Precio m² mínimo:', f'$ {appraisal.precio_m2_minimo:,.2f}' if appraisal.precio_m2_minimo else '—'],
        ['Precio m² máximo:', f'$ {appraisal.precio_m2_maximo:,.2f}' if appraisal.precio_m2_maximo else '—'],
        ['Dispersión:', f'{appraisal.dispersion_pct:.1f}%' if appraisal.dispersion_pct else '—'],
        ['Coeficiente promedio:', f'{appraisal.coeficiente_promedio:.4f}' if appraisal.coeficiente_promedio else '—'],
        ['', ''],
        ['Valor estimado USD:', f'<b>$ {appraisal.valor_estimado_usd:,.2f}</b>' if appraisal.valor_estimado_usd else '—'],
        ['Valor estimado ARS:', f'<b>$ {appraisal.valor_estimado_ars:,.2f}</b>' if appraisal.valor_estimado_ars else '—'],
        ['Valor estimado UVAs:', f'<b>{appraisal.valor_estimado_uvas:,.0f} UVAs</b>' if appraisal.valor_estimado_uvas else '—'],
    ]
    t = Table(res_data, colWidths=[5 * cm, 9 * cm])
    t.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#555')),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LINEABOVE', (0, 5), (-1, 5), 1, colors.HexColor('#1a1a2e')),
        ('FONTSIZE', (0, 6), (-1, 8), 13),
        ('TEXTCOLOR', (0, 6), (-1, 8), colors.HexColor('#1a1a2e')),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 10))

    # ── Firma ──
    elements.append(Paragraph(f'<b>{EMPRESA}</b>', s['Cell']))
    elements.append(Paragraph(f'{DIR}', s['Small']))
    elements.append(Paragraph(f'{TEL}', s['Small']))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph('—' * 30, s['Cell']))
    elements.append(Paragraph('Firma del tasador', s['Small']))

    doc.build(elements, onFirstPage=_header_footer, onLaterPages=_header_footer)
    return buf.getvalue()
