# 🔧 TaskFlow ADHD - Database.py OPTIMISÉ
# Version compatible avec toutes les fonctionnalités

import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
import os

# 🔧 CONFIG DATABASE - Support multi-environnement
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'taskflow-db-minimal'),
    'database': os.getenv('DB_NAME', 'taskflow'),
    'user': os.getenv('DB_USER', 'paul'),
    'password': os.getenv('DB_PASSWORD', 'paul123'),
    'port': os.getenv('DB_PORT', '5432')
}

def get_db_connection():
    """Connexion PostgreSQL avec gestion d'erreurs"""
    try:
        return psycopg2.connect(**DB_CONFIG)
    except psycopg2.OperationalError as e:
        print(f"❌ Database connection error: {e}")
        raise

@contextmanager
def get_db():
    """Context manager pour DB avec cursor dict"""
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            yield cursor
            conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"🔄 Database operation rolled back: {e}")
        raise e
    finally:
        conn.close()

def init_database():
    """Initialize database (for testing)"""
    try:
        with get_db() as cursor:
            # Test connection
            cursor.execute("SELECT 1")
            
            # Check si les tables existent
            cursor.execute("""
                SELECT COUNT(*) as table_count 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('users', 'tasks', 'workflows', 'task_logs')
            """)
            result = cursor.fetchone()
            
            print(f"✅ Database connected! Tables found: {result['table_count']}/4")
            
            # Check user Paul
            cursor.execute("SELECT COUNT(*) as count FROM users WHERE username = 'paul'")
            paul_exists = cursor.fetchone()
            
            if paul_exists['count'] > 0:
                print("👤 User Paul found in database")
            else:
                print("⚠️  User Paul not found - check init.sql")
                
    except Exception as e:
        print(f"❌ Database error: {e}")

def check_db_health():
    """Health check pour monitoring"""
    try:
        with get_db() as cursor:
            cursor.execute("SELECT NOW() as timestamp, version() as version")
            result = cursor.fetchone()
            return {
                "status": "healthy",
                "timestamp": result["timestamp"],
                "version": result["version"]
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

if __name__ == "__main__":
    print("🧪 Testing database connection...")
    init_database()
    health = check_db_health()
    print(f"🏥 Health status: {health['status']}")