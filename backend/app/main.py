"""FastAPI application entry point."""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.database import engine, Base
from app.models import *  # noqa: ensure all models are loaded
from app.routers import (
    tasks, categories, special_days, time_records,
    memos, dashboard, llm, settings as settings_router,
)
from app.utils.scheduler import init_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables, init scheduler. Shutdown: cleanup."""
    Base.metadata.create_all(bind=engine)
    init_scheduler()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server + GitHub Pages
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://zhang21901.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(tasks.router)
app.include_router(categories.router)
app.include_router(special_days.router)
app.include_router(time_records.router)
app.include_router(memos.router)
app.include_router(dashboard.router)
app.include_router(llm.router)
app.include_router(settings_router.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}


# --- Serve built frontend (production) ---
FRONTEND_DIST = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)

if os.path.isdir(FRONTEND_DIST):
    # Serve static assets (JS, CSS, images etc.)
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")),
        name="assets",
    )

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        """Catch-all: serve index.html for SPA client-side routing."""
        # Don't intercept API paths (shouldn't reach here, but safety)
        if full_path.startswith("api/"):
            from fastapi.responses import JSONResponse
            return JSONResponse({"detail": "Not Found"}, status_code=404)

        index_path = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "Frontend not built. Run: cd frontend && npm run build"}
