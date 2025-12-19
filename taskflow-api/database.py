import psycopg2
import psycopg2.extras
import os
from contextlib import contextmanager

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://taskflow:taskflow123@localhost:4002/taskflow_adhd")

@contextmanager
def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    try:
        # Enable dict cursor for easier data access
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def get_db_connection():
    """
    Retourne une connexion directe à la base de données
    (pour les routes qui ont besoin de plus de contrôle)
    """
    return psycopg2.connect(DATABASE_URL)

def init_db():
    """
    Cette fonction n'initialise plus rien car init.sql fait le travail
    Elle est gardée pour compatibilité avec main.py
    """
    print("✅ Database initialization handled by init.sql")
    pass