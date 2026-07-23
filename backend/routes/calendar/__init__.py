from flask import Blueprint

bp = Blueprint('calendar', __name__, url_prefix='/api/calendar')

from . import manage
