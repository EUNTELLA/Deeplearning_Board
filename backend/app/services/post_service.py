from __future__ import annotations

from datetime import datetime


_posts: list[dict] = []


def list_posts(category: str | None = None, skip: int = 0, limit: int = 12) -> dict:
    items = _posts
    if category:
        items = [post for post in items if post["prediction"] == category]

    return {
        "items": items[skip : skip + limit],
        "total": len(items),
        "skip": skip,
        "limit": limit,
    }


def get_post(post_id: int) -> dict | None:
    return next((post for post in _posts if post["id"] == post_id), None)


def create_post(payload: dict) -> dict:
    post = {
        "id": max((item["id"] for item in _posts), default=0) + 1,
        "title": payload.get("title") or "분류 결과",
        "image_url": payload.get("image_url") or "",
        "prediction": payload.get("prediction") or payload.get("predicted_class") or "unknown",
        "confidence": float(payload.get("confidence") or 0),
        "created_at": datetime.now().isoformat(timespec="seconds"),
    }
    _posts.insert(0, post)
    return post
