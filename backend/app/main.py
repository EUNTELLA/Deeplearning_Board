from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from backend.app.routers import pages, post, predict


BASE_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIR = BASE_DIR / "frontend"

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

app.include_router(pages.router)
app.include_router(post.router, prefix="/api/v1")
app.include_router(predict.router, prefix="/api/v1")
