# 🎯 TaskFlow ADHD - Main.py SIMPLE pour déboguer
# Version de débogage progressive sans auth_routes

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from database import get_db, init_database
import uvicorn

# 🚀 FASTAPI APP SIMPLE
app = FastAPI(
    title="TaskFlow ADHD API",
    description="API pour gestion des tâches ADHD de Paul",
    version="3.0.0-debug",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 🌐 CORS - Configuration pour développement
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)

# 🏠 ROOT & DEBUG ROUTES
@app.get("/")
async def root():
    """Page d'accueil de l'API"""
    return {
        "message": "🎯 TaskFlow ADHD API - Paul Delhomme",
        "version": "3.0.0-debug",
        "status": "✅ Debug Mode",
        "routes": ["/", "/health", "/db-test", "/debug"]
    }

@app.get("/health")
async def health_check():
    """Health check avec test DB"""
    try:
        with get_db() as cursor:
            cursor.execute("SELECT COUNT(*) as count FROM users WHERE is_active = true")
            user_count = cursor.fetchone()["count"]
            
        return {
            "status": "healthy",
            "service": "taskflow-api",
            "database": "✅ Connected",
            "active_users": user_count
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

@app.get("/db-test")
async def test_database():
    """Test database connection détaillé"""
    try:
        with get_db() as cursor:
            # Test tables
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
            tables = [row["table_name"] for row in cursor.fetchall()]
            
            # Test users
            cursor.execute("SELECT COUNT(*) as count FROM users")
            user_count = cursor.fetchone()["count"]
            
            # Test tasks
            cursor.execute("SELECT COUNT(*) as count FROM tasks")
            task_count = cursor.fetchone()["count"]
            
            return {
                "database": "✅ Connected",
                "tables": tables,
                "users_count": user_count,
                "tasks_count": task_count,
                "query_success": True
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/debug")
async def debug_info():
    """Info de débogage"""
    import os
    import sys
    
    return {
        "python_version": sys.version,
        "working_directory": os.getcwd(),
        "files_in_app": os.listdir("/app") if os.path.exists("/app") else [],
        "python_path": sys.path
    }

# 🔄 Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    print("🚀 Starting TaskFlow ADHD API Debug Mode...")
    init_database()
    print("✅ API ready!")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)