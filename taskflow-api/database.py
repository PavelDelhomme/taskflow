import psycopg2
import psycopg2.extras
import os
from contextlib import contextmanager

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://taskflow:taskflow123@localhost:5435/taskflow_adhd")

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

def init_db():
    """
    Cette fonction n'initialise plus rien car init.sql fait le travail
    Elle est gardée pour compatibilité avec main.py
    """
    print("✅ Database initialization handled by init.sql")
    pass