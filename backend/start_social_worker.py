"""
Entry point para el Social Worker Daemon en Render.
Uso: python start_social_worker.py
"""
from social.worker import run_forever

if __name__ == '__main__':
    run_forever()
