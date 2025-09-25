from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import des routes
from auth import router as auth_router
from tasks import router as tasks_router

# 🚀 FASTAPI APP
app = FastAPI(
    title="TaskFlow ADHD API",
    description="API pour gestion des tâches ADHD de Paul",
    version="1.0.0"
)

# 🌐 CORS - Autoriser toutes les origines pour les tests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En prod: ["http://localhost:3003"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# 🛣️ ROUTES
app.include_router(auth_router)
app.include_router(tasks_router)

# 🏥 HEALTH CHECK
@app.get("/")
async def root():
    return {
        "message": "🎯 TaskFlow ADHD API - Paul Delhomme",
        "version": "1.0.0",
        "status": "✅ Running",
        "routes": {
            "auth": "/auth",
            "tasks": "/tasks",
            "docs": "/docs",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": "2025-09-25T18:35:00",
        "service": "taskflow-api"
    }

# 🚀 RUN
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)