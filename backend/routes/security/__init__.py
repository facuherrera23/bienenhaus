from flask import Blueprint

bp = Blueprint('security', __name__, url_prefix='/api/security')

from . import manage
