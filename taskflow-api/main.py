from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routes import auth, tasks, reports, workflows

# FastAPI app
app = FastAPI(title="TaskFlow ADHD API", version="2.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for multi-device
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(reports.router)
app.include_router(workflows.router)

@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}

# Initialize on startup
@app.on_event("startup")
async def startup():
    init_db()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
