"""SQLite database for game state persistence."""

from __future__ import annotations

import json
import os
from pathlib import Path

import aiosqlite

DB_DIR = Path(os.getenv("DATABASE_DIR", "data"))
DB_PATH = DB_DIR / "bellum_mundi.db"


async def get_db() -> aiosqlite.Connection:
    DB_DIR.mkdir(parents=True, exist_ok=True)
    db = await aiosqlite.connect(str(DB_PATH))
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    """Create tables if they don't exist."""
    db = await get_db()
    try:
        await db.executescript(
            """
            CREATE TABLE IF NOT EXISTS games (
                game_id TEXT PRIMARY KEY,
                preset_id TEXT NOT NULL,
                state_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS saves (
                save_id TEXT PRIMARY KEY,
                game_id TEXT NOT NULL,
                name TEXT NOT NULL,
                state_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (game_id) REFERENCES games(game_id)
            );
            """
        )
        await db.commit()
    finally:
        await db.close()


async def save_game_state(game_id: str, preset_id: str, state_json: str):
    db = await get_db()
    try:
        await db.execute(
            """
            INSERT OR REPLACE INTO games (game_id, preset_id, state_json, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            """,
            (game_id, preset_id, state_json),
        )
        await db.commit()
    finally:
        await db.close()


async def load_game_state(game_id: str) -> str | None:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT state_json FROM games WHERE game_id = ?", (game_id,)
        )
        row = await cursor.fetchone()
        return row[0] if row else None
    finally:
        await db.close()


async def create_save(save_id: str, game_id: str, name: str, state_json: str):
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO saves (save_id, game_id, name, state_json) VALUES (?, ?, ?, ?)",
            (save_id, game_id, name, state_json),
        )
        await db.commit()
    finally:
        await db.close()


async def list_saves() -> list[dict]:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT save_id, game_id, name, created_at FROM saves ORDER BY created_at DESC"
        )
        rows = await cursor.fetchall()
        return [
            {
                "save_id": r[0],
                "game_id": r[1],
                "name": r[2],
                "created_at": r[3],
            }
            for r in rows
        ]
    finally:
        await db.close()


async def load_save(save_id: str) -> str | None:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT state_json FROM saves WHERE save_id = ?", (save_id,)
        )
        row = await cursor.fetchone()
        return row[0] if row else None
    finally:
        await db.close()
