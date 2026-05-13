from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse


BASE_DIR = Path(__file__).resolve().parents[3]
SPA_INDEX = BASE_DIR / "frontend" / "dist" / "index.html"

router = APIRouter()


@router.get("/{full_path:path}", include_in_schema=False)
def serve_spa(full_path: str):
    if full_path.startswith(("api/", "static/", "word-images/", "assets/")):
        raise HTTPException(status_code=404)

    if not SPA_INDEX.exists():
        raise HTTPException(
            status_code=503,
            detail="React build not found. Run `npm install && npm run build` in frontend.",
        )

    return FileResponse(SPA_INDEX)
