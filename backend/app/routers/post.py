from fastapi import APIRouter, HTTPException

from backend.app.services.post_service import (
    create_post,
    delete_post,
    get_post,
    list_posts,
    update_post,
)


router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("")
def read_posts(category: str | None = None, skip: int = 0, limit: int = 12):
    return list_posts(category=category, skip=skip, limit=limit)


@router.get("/{post_id}")
def read_post(post_id: int):
    post = get_post(post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.post("")
def add_post(payload: dict):
    return create_post(payload)


@router.put("/{post_id}")
def edit_post(post_id: int, payload: dict):
    post = update_post(post_id, payload)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.delete("/{post_id}")
def remove_post(post_id: int):
    if not delete_post(post_id):
        raise HTTPException(status_code=404, detail="Post not found")
    return {"deleted": True}
