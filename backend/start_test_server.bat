@echo off
set FLASK_APP=app.py
set FLASK_ENV=development
set DATABASE_URL=sqlite:///test_e2e.db
set ADMIN_PASSWORD=Admin123!
start /B python -m flask run --port 5000 --no-debugger --no-reload
