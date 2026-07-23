from .base import PortalBase
from .export import export_property_json, export_property_xml, export_rental_json, export_rental_xml
from .queue import QueueService
from .zonaprop import ZonaPropAdapter
from .mercadolibre import MercadoLibreAdapter
from .sync import sync_bidirectional

ADAPTER_REGISTRY = {
    'zonaprop': ZonaPropAdapter,
    'mercadolibre': MercadoLibreAdapter,
}

__all__ = ['PortalBase', 'export_property_json', 'export_property_xml',
           'export_rental_json', 'export_rental_xml', 'QueueService',
           'ZonaPropAdapter', 'MercadoLibreAdapter', 'ADAPTER_REGISTRY',
                       'sync_bidirectional']
