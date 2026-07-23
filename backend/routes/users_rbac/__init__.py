from flask import Blueprint

bp = Blueprint('users_rbac', __name__, url_prefix='/api/admin/rbac')

from . import manage
