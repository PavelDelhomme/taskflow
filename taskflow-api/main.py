from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
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
from routes.stats import router as stats_router
from routes.energy import router as energy_router
from routes.breaks import router as breaks_router
from routes.reminders import router as reminders_router
from routes.attention import router as attention_router
from routes.ai_suggestions import router as ai_suggestions_router

# 🚀 FASTAPI APP
app = FastAPI(
    title="TaskFlow ADHD API",
    description="API pour gestion des tâches ADHD",
    version="1.0.0",
    redirect_slashes=False
)

# 🌐 CORS — CORS_ORIGINS (virgules) ou * en dev
_cors_raw = os.getenv("CORS_ORIGINS", "*")
_cors_origins = ["*"] if _cors_raw.strip() == "*" else [o.strip() for o in _cors_raw.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
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
app.include_router(stats_router)
app.include_router(energy_router)
app.include_router(breaks_router)
app.include_router(reminders_router)
app.include_router(attention_router)
app.include_router(ai_suggestions_router)

# 🏥 HEALTH CHECK
@app.get("/")
async def root():
    return {
        "message": "🎯 TaskFlow ADHD API",
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