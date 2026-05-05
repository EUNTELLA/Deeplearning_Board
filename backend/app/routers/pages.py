from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates


BASE_DIR = Path(__file__).resolve().parents[3]
templates = Jinja2Templates(directory=BASE_DIR / "frontend" / "templates")

router = APIRouter()


@router.get("/")
def home(request: Request):
    return templates.TemplateResponse(request, "index.html")


@router.get("/board")
def board(request: Request):
    return templates.TemplateResponse(request, "board.html")


@router.get("/post/{post_id}")
def post_detail(request: Request, post_id: int):
    return templates.TemplateResponse(
        request,
        "post_detail.html",
        {"post_id": post_id},
    )
