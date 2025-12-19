from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import des routes
from routes.auth import router as auth_router
from routes.tasks import router as tasks_router
from routes.workflows import router as workflows_router
from routes.reports import router as reports_router
from routes.templates import router as templates_router
from routes.subtasks import router as subtasks_router
from routes.tags import router as tags_router
from routes.notes import router as notes_router

# 🚀 FASTAPI APP
app = FastAPI(
    title="TaskFlow ADHD API",
    description="API pour gestion des tâches ADHD de Paul",
    version="1.0.0",
    redirect_slashes=False
)

# 🌐 CORS - Autoriser toutes les origines pour les tests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En prod: ["http://localhost:4000"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# 🛣️ ROUTES
app.include_router(auth_router)
app.include_router(tasks_router)
app.include_router(workflows_router)
app.include_router(reports_router)
app.include_router(templates_router)
app.include_router(subtasks_router)
app.include_router(tags_router)
app.include_router(notes_router)

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
            "workflows": "/workflows",
            "reports": "/reports",
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