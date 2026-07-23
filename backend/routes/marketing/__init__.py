from flask import Blueprint

bp = Blueprint('marketing', __name__, url_prefix='/api/marketing')

from . import manage
