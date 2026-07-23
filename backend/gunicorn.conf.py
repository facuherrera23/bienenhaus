import os

workers = 4
worker_class = "gevent"
worker_connections = 1000
timeout = 120
graceful_timeout = 30
accesslog = "-"
errorlog = "-"
capture_output = True
loglevel = "info"

bind = f"0.0.0.0:{os.getenv('PORT', '5000')}"
