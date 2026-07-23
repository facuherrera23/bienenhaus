from flask import Blueprint

bp = Blueprint('requests', __name__)

from . import manage
