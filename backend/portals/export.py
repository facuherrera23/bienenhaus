"""
portals/export.py — Exportación de propiedades a JSON y XML
para consumo por APIs de portales inmobiliarios.
"""
import json
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom import minidom


def _base_property_dict(prop):
    return {
        'id': prop.id,
        'title': prop.title,
        'type': prop.type,
        'location': prop.location,
        'description': prop.description,
        'price': prop.price,
        'currency': 'USD',
        'beds': prop.beds,
        'baths': prop.baths,
        'sqm': prop.sqm,
        'sqm_total': prop.sqm_total,
        'parkings': prop.parkings,
        'antiquity': prop.antiquity,
        'floor': prop.floor,
        'status': prop.status,
        'featured': prop.featured,
        'images': prop.images,
        'created_at': str(prop.created_at) if prop.created_at else '',
    }


def _base_rental_dict(rental):
    return {
        'id': rental.id,
        'title': rental.title,
        'type': rental.type,
        'location': rental.location,
        'description': rental.description,
        'price_ars': rental.price_ars,
        'expenses': rental.expenses,
        'currency': 'ARS',
        'beds': rental.beds,
        'baths': rental.baths,
        'sqm': rental.sqm,
        'status': rental.status,
        'featured': rental.featured,
        'images': rental.images,
        'min_months': rental.min_months,
        'furnished': rental.furnished,
        'created_at': str(rental.created_at) if rental.created_at else '',
    }


def export_property_json(prop, indent=2):
    """Exporta una propiedad a JSON."""
    return json.dumps(_base_property_dict(prop), indent=indent, ensure_ascii=False)


def export_rental_json(rental, indent=2):
    """Exporta un alquiler a JSON."""
    return json.dumps(_base_rental_dict(rental), indent=indent, ensure_ascii=False)


def _dict_to_xml(parent, data):
    for key, value in data.items():
        child = SubElement(parent, key.replace(' ', '_'))
        if isinstance(value, dict):
            _dict_to_xml(child, value)
        elif isinstance(value, list):
            for item in value:
                item_elem = SubElement(child, 'item')
                if isinstance(item, dict):
                    _dict_to_xml(item_elem, item)
                else:
                    item_elem.text = str(item)
        else:
            child.text = str(value) if value is not None else ''


def export_property_xml(prop):
    """Exporta una propiedad a XML."""
    root = Element('property')
    _dict_to_xml(root, _base_property_dict(prop))
    return minidom.parseString(tostring(root, encoding='unicode')).toprettyxml(indent='  ')


def export_rental_xml(rental):
    """Exporta un alquiler a XML."""
    root = Element('rental')
    _dict_to_xml(root, _base_rental_dict(rental))
    return minidom.parseString(tostring(root, encoding='unicode')).toprettyxml(indent='  ')


def export_properties_batch(properties, fmt='json'):
    """Exporta múltiples propiedades en lote."""
    items = [_base_property_dict(p) for p in properties]
    if fmt == 'xml':
        root = Element('properties')
        for item in items:
            prop_elem = SubElement(root, 'property')
            _dict_to_xml(prop_elem, item)
        return minidom.parseString(tostring(root, encoding='unicode')).toprettyxml(indent='  ')
    return json.dumps({'properties': items}, indent=2, ensure_ascii=False)
