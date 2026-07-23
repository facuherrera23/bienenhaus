from flask import Blueprint

bp = Blueprint('messages', __name__)

from . import conversations, messages, links
