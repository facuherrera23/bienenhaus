# Manual de Operaciones — Bienenhaus Propiedades

## 📋 Rutinas Diarias

### 1. Health Check
```bash
curl http://localhost:5000/api/health
# Respuesta esperada: {"ok":true,"status":"healthy","database":"healthy",...}
```

### 2. Revisar cola de portales
```bash
curl http://localhost:5000/api/health | grep queue
# pending > 0 significa propiedades esperando publicación
```

### 3. Revisar Logs
```bash
# Flask
tail -f backend/flask_out.txt

# Worker de portales
tail -f portal_worker.log

# Worker de redes sociales
tail -f social_worker.log
```

---

## 🔧 Tareas Frecuentes

### Resetear Base de Datos
```bash
cd backend && flask db-clean
# Borra TODO y recrea con admin por defecto (Admin123!)
```

### Aplicar Migraciones
```bash
cd backend && flask db-setup
# Aplica migraciones pendientes y recrea portales + admin
```

### Sincronizar MercadoLibre
```bash
# Unidireccional (ML → local)
cd backend && flask ml-sync

# Bidireccional (ML ↔ local, resuelve conflictos)
cd backend && flask ml-sync --bidirectional
```

### Procesar Cola de Portales
```bash
# Un solo ciclo
cd backend && python portal_worker.py

# En modo watch (cada 60s)
cd backend && python portal_worker.py --watch
```

### Worker de Redes Sociales
```bash
# Un ciclo
cd backend && python start_social_worker.py

# Daemon continuo
cd backend && flask social-worker-daemon
```

### Reconstruir Frontend
```bash
cd frontend && npm run build
# Minifica JS y CSS, genera bundles
```

---

## 🚨 Incidentes Comunes

### La app no arranca
1. Revisar `.env` — `SECRET_KEY`, `DATABASE_URL`, `ADMIN_PASSWORD` obligatorios
2. Ver logs: `cat backend/flask_err.txt`
3. Probar con `DATABASE_URL=sqlite:///test.db` para aislar problema de DB

### Error de migración
```bash
cd backend
flask db history        # Ver historial
flask db upgrade        # Ir a latest
flask db downgrade      # Retroceder si es necesario
```

### Login no funciona
1. El admin se crea con `ADMIN_PASSWORD` env var
2. Si cambiás la pass en `.env`, no se actualiza sola — correr:
   ```bash
   cd backend && flask db-clean
   ```
   O directamente desde Python:
   ```python
   from auth_helper import seed_admin_user
   seed_admin_user()
   ```
3. Lockout: esperar 15 min o resetear:
   ```bash
   python -c "
   from app import create_app; from extensions import db; from models import User
   app = create_app()
   with app.app_context():
       u = User.query.filter_by(username='admin').first()
       if u: u.login_attempts = 0; u.locked_until = None; db.session.commit()
   "
   ```

### Portal Worker falla
1. Revisar `.env` — `ML_CLIENT_ID`, `ML_CLIENT_SECRET`, `ML_REFRESH_TOKEN`
2. Los tokens de ML expiran — renovar en https://developers.mercadolibre.com.ar
3. ZonaProp requiere SFTP — verificar credenciales en configuración del panel admin

### Tasación no genera PDF
1. El PDF servidor usa reportlab — verificar que esté instalado (`pip install reportlab`)
2. El PDF cliente usa jsPDF — se genera en el navegador, verificar que no haya bloqueo de scripts

---

## 📦 Backup

### Base de Datos (PostgreSQL)
```bash
pg_dump -U postgres bienenhaus > backup_$(date +%Y%m%d).sql
```

### Base de Datos (SQLite)
```bash
cp bienenhaus.db backup_$(date +%Y%m%d).db
```

### Imágenes
Las imágenes están en Cloudinary — no requieren backup manual.
Si usás almacenamiento local:
```bash
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/static/uploads/
```

### Restore
```bash
# PostgreSQL
psql -U postgres bienenhaus < backup_20261227.sql

# SQLite
cp backup_20261227.db bienenhaus.db
```

---

## 🐳 Docker

### Iniciar todo
```bash
docker compose up -d
```

### Ver logs
```bash
docker compose logs -f app
```

### Reconstruir
```bash
docker compose build --no-cache app
docker compose up -d
```

---

## 🔄 Deploy

### Render.com
El deploy es automático via GitHub Actions:
1. Push a `main` → corre tests → si pasan → deploy a Render
2. Ver progreso en: https://dashboard.render.com

### Manual
```bash
git push origin main
# GitHub Actions corre tests + lint
# Si pasa, deploy automático
```

---

## 📊 Monitoreo

| Qué | Dónde |
|-----|-------|
| Errores de código | Sentry (configurar `SENTRY_DSN` en `.env`) |
| Health check | `GET /api/health` |
| Estadísticas | Dashboard admin → pestaña Dashboard |
| Logs de portales | `backend/flask_out.txt` o panel Admin → Portales → Logs |
| Cola de publicaciones | Admin → Portales → Cola |
| Redes sociales | Admin → Marketing → Publicaciones |

---

## 👤 Usuarios y Roles

| Rol | Permisos |
|-----|----------|
| admin | Todo: CRUD propiedades, agentes, usuarios, tasaciones, portales, configuración |
| editor | CRUD propiedades, agentes, tasaciones. No puede crear usuarios ni ver configuración |
| viewer | Solo lectura: puede ver dashboard, propiedades, agentes |

Crear usuario editor:
```bash
# Desde el panel Admin → Usuarios → + Nuevo usuario
# O desde CLI:
python -c "
from app import create_app; from extensions import db, bcrypt; from models import User
app = create_app()
with app.app_context():
    u = User(username='editor', email='editor@bienenhaus.com.ar',
             password_hash=bcrypt.generate_password_hash('Editor123!').decode(),
             role='editor')
    db.session.add(u); db.session.commit()
"
```
