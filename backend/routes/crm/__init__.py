from flask import Blueprint

bp = Blueprint('crm', __name__)

from . import leads, activities, tasks, visits, reminders, pipeline, automation
