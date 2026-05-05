from __future__ import annotations

import sqlite3
from datetime import datetime
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "app.db"


def _connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    _init_db(connection)
    return connection


def _init_db(connection: sqlite3.Connection) -> None:
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            image_url TEXT NOT NULL DEFAULT '',
            prediction TEXT NOT NULL DEFAULT 'unknown',
            confidence REAL NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )
        """
    )
    connection.commit()


def _row_to_post(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "image_url": row["image_url"],
        "prediction": row["prediction"],
        "confidence": row["confidence"],
        "created_at": row["created_at"],
    }


def list_posts(category: str | None = None, skip: int = 0, limit: int = 12) -> dict:
    skip = max(skip, 0)
    limit = max(min(limit, 100), 1)

    with _connect() as connection:
        if category:
            total = connection.execute(
                "SELECT COUNT(*) AS count FROM posts WHERE prediction = ?",
                (category,),
            ).fetchone()["count"]
            rows = connection.execute(
                """
                SELECT * FROM posts
                WHERE prediction = ?
                ORDER BY id DESC
                LIMIT ? OFFSET ?
                """,
                (category, limit, skip),
            ).fetchall()
        else:
            total = connection.execute("SELECT COUNT(*) AS count FROM posts").fetchone()["count"]
            rows = connection.execute(
                """
                SELECT * FROM posts
                ORDER BY id DESC
                LIMIT ? OFFSET ?
                """,
                (limit, skip),
            ).fetchall()

    return {
        "items": [_row_to_post(row) for row in rows],
        "total": total,
        "skip": skip,
        "limit": limit,
    }


def get_post(post_id: int) -> dict | None:
    with _connect() as connection:
        row = connection.execute(
            "SELECT * FROM posts WHERE id = ?",
            (post_id,),
        ).fetchone()

    return _row_to_post(row) if row else None


def update_post(post_id: int, payload: dict) -> dict | None:
    title = str(payload.get("title") or "").strip()
    if not title:
        return get_post(post_id)

    with _connect() as connection:
        cursor = connection.execute(
            "UPDATE posts SET title = ? WHERE id = ?",
            (title, post_id),
        )
        connection.commit()

    if cursor.rowcount == 0:
        return None

    return get_post(post_id)


def create_post(payload: dict) -> dict:
    title = str(payload.get("title") or "").strip() or "분류 결과"
    image_url = str(payload.get("image_url") or "")
    prediction = str(payload.get("prediction") or payload.get("predicted_class") or "unknown")
    confidence = float(payload.get("confidence") or 0)
    created_at = datetime.now().isoformat(timespec="seconds")

    with _connect() as connection:
        cursor = connection.execute(
            """
            INSERT INTO posts (title, image_url, prediction, confidence, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (title, image_url, prediction, confidence, created_at),
        )
        connection.commit()
        post_id = cursor.lastrowid

    post = get_post(post_id)
    if post is None:
        raise RuntimeError("Failed to create post")

    return post
