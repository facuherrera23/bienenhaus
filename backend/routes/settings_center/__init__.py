from flask import Blueprint

bp = Blueprint('settings_center', __name__, url_prefix='/api/settings-center')

from . import manage
