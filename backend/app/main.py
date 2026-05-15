from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.app.routers import pages, post, predict


BASE_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIR = BASE_DIR / "frontend"
REACT_DIST_DIR = BASE_DIR / "frontend" / "dist"

app = FastAPI(title="ASL Letter Board")

app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR / "static"),
    name="static",
)
app.mount(
    "/word-images",
    StaticFiles(directory=BASE_DIR / "docs" / "image" / "words"),
    name="word_images",
)
app.mount(
    "/test-images",
    StaticFiles(directory=BASE_DIR / "docs" / "image" / "test_image"),
    name="test_images",
)
if (REACT_DIST_DIR / "assets").exists():
    app.mount(
        "/assets",
        StaticFiles(directory=REACT_DIST_DIR / "assets"),
        name="react_assets",
    )

app.include_router(post.router, prefix="/api/v1")
app.include_router(predict.router, prefix="/api/v1")
app.include_router(pages.router)
