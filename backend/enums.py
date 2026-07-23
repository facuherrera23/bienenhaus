import enum


class TipoOperacion(str, enum.Enum):
    VENTA = 'venta'
    COTIZACION = 'cotizacion'


class TipoPropiedad(str, enum.Enum):
    CASA = 'casa'
    DEPARTAMENTO = 'departamento'
    PH = 'ph'
    LOCAL = 'local'
    TERRENO = 'terreno'
    OFICINA = 'oficina'


class EstadoConservacion(str, enum.Enum):
    EXCELENTE = 'excelente'
    MUY_BUENO = 'muy_bueno'
    BUENO = 'bueno'
    REGULAR = 'regular'
    A_RECICLAR = 'a_reciclar'


class PropertyStatus(str, enum.Enum):
    DISPONIBLE = 'disponible'
    VENDIDA = 'vendida'
    OCULTA = 'oculta'
    ALQUILADA = 'alquilada'
    LISTO_PARA_PUBLICAR = 'listo_para_publicar'


class RentalStatus(str, enum.Enum):
    DISPONIBLE = 'disponible'
    ALQUILADA = 'alquilada'
    OCULTA = 'oculta'
    LISTO_PARA_PUBLICAR = 'listo_para_publicar'


class PortalAction(str, enum.Enum):
    PUBLISH = 'publish'
    UPDATE = 'update'
    UNPUBLISH = 'unpublish'
