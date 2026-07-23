@echo off
cd /d "C:\Users\facuh\Desktop\Dlicias APP\bienenhaus\backend"
set FLASK_APP=app.py
set FLASK_ENV=development
set DATABASE_URL=sqlite:///test_e2e.db
set ADMIN_PASSWORD=Admin123!
REM Seed the DB first
python -c "import os;os.environ.update(FLASK_APP='app.py',DATABASE_URL='sqlite:///test_e2e.db',ADMIN_PASSWORD='Admin123!');os.chdir(r'C:\Users\facuh\Desktop\Dlicias APP\bienenhaus\backend');from app import create_app;from extensions import bcrypt,db;from models import User;app=create_app();app.app_context().push();db.create_all();from auth_helper import seed_admin_user;seed_admin_user();u=User.query.filter_by(username='admin').first();print('SEED_OK' if bcrypt.check_password_hash(u.password_hash,'Admin123!')else'SEED_FAIL')"
REM Start server
start /B python -m flask run --port 5000 --no-debugger --no-reload
