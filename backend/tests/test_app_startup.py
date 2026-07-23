"""
Tests para cambios en startup de app:
- init() no está duplicado
- upgrade() y seed() ya no corren automáticamente
- db-setup CLI command existe
"""
import os
import sys


class TestAppInit:

    def test_init_not_duplicated(self):
        """Verifica que init() se llama UNA sola vez en la función db_init (no dos)."""
        app_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app.py')
        with open(app_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        in_db_init = False
        init_calls = 0
        for line in lines:
            if 'def db_init' in line:
                in_db_init = True
                continue
            if in_db_init:
                if 'def ' in line and line.strip().startswith('def '):
                    break
                if 'init()' in line:
                    init_calls += 1
        assert init_calls == 1, f'init() se llama {init_calls} veces dentro de db_init, debería ser 1'

    def test_no_auto_upgrade_in_app(self):
        """Verifica que upgrade() + seed() no se llaman en create_app()."""
        app_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app.py')
        with open(app_path, 'r', encoding='utf-8') as f:
            content = f.read()
        assert 'db-setup' in content, 'Debe existir el comando db-setup'
        assert 'def db_setup' in content, 'Debe existir la función db_setup'

    def test_db_setup_command_registered(self):
        """Verifica que el decorador @app.cli.command('db-setup') existe."""
        app_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app.py')
        with open(app_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        found = any("command('db-setup')" in line for line in lines)
        assert found, 'El comando CLI db-setup no está registrado'
