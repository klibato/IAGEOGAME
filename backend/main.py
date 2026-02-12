"""FastAPI application — Bellum Mundi backend."""

from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.database.db import init_db
from backend.engine import game_engine, simulation, diplomacy, advisor, consolidator, action_processor
from backend.models.game_state import GameState, PlayerAction
from backend.llm import ollama_client


# ── In-memory game store (backed by SQLite for persistence) ──────────────────
_games: dict[str, GameState] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Bellum Mundi", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response models ────────────────────────────────────────────────

class CreateGameRequest(BaseModel):
    preset_id: str
    player_nation_id: str
    difficulty: str = "normal"
    ollama_model: str = "mistral"


class ActionRequest(BaseModel):
    text: str


class JumpRequest(BaseModel):
    duration: str  # 1_week, 2_weeks, 1_month, 3_months, 6_months, 1_year, custom
    custom_days: Optional[int] = None


class ChatRequest(BaseModel):
    target_nation_id: str
    message: str


class AdvisorRequest(BaseModel):
    question: str


class EnhanceRequest(BaseModel):
    action_text: str


class SaveRequest(BaseModel):
    name: str


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_game(game_id: str) -> GameState:
    state = _games.get(game_id)
    if not state:
        raise HTTPException(status_code=404, detail="Game not found")
    return state


# ── Preset endpoints ─────────────────────────────────────────────────────────

@app.get("/api/presets")
async def list_presets():
    return game_engine.list_presets()


@app.get("/api/presets/{preset_id}")
async def get_preset(preset_id: str):
    try:
        return game_engine.load_preset(preset_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Preset not found")


# ── Ollama endpoints ─────────────────────────────────────────────────────────

@app.get("/api/ollama/models")
async def ollama_models():
    models = await ollama_client.list_models()
    return {"models": models}


@app.get("/api/ollama/status")
async def ollama_status():
    return await ollama_client.check_status()


# ── Game CRUD ────────────────────────────────────────────────────────────────

@app.post("/api/game/create")
async def create_game(req: CreateGameRequest):
    try:
        state = game_engine.create_game(
            preset_id=req.preset_id,
            player_nation_id=req.player_nation_id,
            difficulty=req.difficulty,
            ollama_model=req.ollama_model,
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Preset not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    _games[state.game_id] = state
    await game_engine.persist_state(state)
    return {"game_id": state.game_id, "state": state.model_dump()}


@app.get("/api/game/{game_id}")
async def get_game(game_id: str):
    state = _get_game(game_id)
    return state.model_dump()


# ── Actions ──────────────────────────────────────────────────────────────────

@app.post("/api/game/{game_id}/action")
async def submit_action(game_id: str, req: ActionRequest):
    state = _get_game(game_id)
    action = PlayerAction(text=req.text, submitted_at_turn=state.turn_number)
    state.pending_actions.append(action)
    await game_engine.persist_state(state)
    return {"action_id": action.id, "actions": [a.model_dump() for a in state.pending_actions]}


@app.delete("/api/game/{game_id}/action/{action_id}")
async def delete_action(game_id: str, action_id: str):
    state = _get_game(game_id)
    state.pending_actions = [a for a in state.pending_actions if a.id != action_id]
    await game_engine.persist_state(state)
    return {"actions": [a.model_dump() for a in state.pending_actions]}


# ── Jump Forward ─────────────────────────────────────────────────────────────

@app.post("/api/game/{game_id}/jump")
async def jump_forward(game_id: str, req: JumpRequest):
    state = _get_game(game_id)

    events = await simulation.run_simulation(
        state=state,
        duration_key=req.duration,
        custom_days=req.custom_days,
    )

    # Apply events to state
    for event in events:
        game_engine.apply_event(state, event)

    # Maybe consolidate
    await consolidator.maybe_consolidate(state)

    # Persist
    await game_engine.persist_state(state)

    return {
        "events": [e.model_dump() for e in events],
        "new_date": state.current_date,
        "turn_number": state.turn_number,
        "world_narrative": "",
    }


# ── Diplomacy ────────────────────────────────────────────────────────────────

@app.post("/api/game/{game_id}/chat")
async def diplomatic_chat(game_id: str, req: ChatRequest):
    state = _get_game(game_id)
    try:
        response = await diplomacy.send_diplomatic_message(
            state=state,
            target_nation_id=req.target_nation_id,
            player_message=req.message,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    await game_engine.persist_state(state)
    return {
        "response": response,
        "chat_history": [
            m.model_dump() for m in state.chat_histories.get(req.target_nation_id, [])
        ],
    }


# ── Advisor ──────────────────────────────────────────────────────────────────

@app.post("/api/game/{game_id}/advisor")
async def ask_advisor_endpoint(game_id: str, req: AdvisorRequest):
    state = _get_game(game_id)
    response = await advisor.ask_advisor(state=state, question=req.question)
    return {"response": response}


# ── Brainstorm & Enhance ─────────────────────────────────────────────────────

@app.post("/api/game/{game_id}/brainstorm")
async def brainstorm(game_id: str):
    state = _get_game(game_id)
    suggestions = await action_processor.brainstorm_actions(state)
    return {"suggestions": suggestions}


@app.post("/api/game/{game_id}/enhance")
async def enhance(game_id: str, req: EnhanceRequest):
    state = _get_game(game_id)
    enhanced = await action_processor.enhance_action(state, req.action_text)
    return {"enhanced_action": enhanced}


# ── Events ───────────────────────────────────────────────────────────────────

@app.get("/api/game/{game_id}/events")
async def get_events(game_id: str):
    state = _get_game(game_id)
    return {"events": [e.model_dump() for e in state.events_log]}


# ── Save / Load ──────────────────────────────────────────────────────────────

@app.post("/api/game/{game_id}/save")
async def save_game(game_id: str, req: SaveRequest):
    state = _get_game(game_id)
    save_id = uuid.uuid4().hex[:12]
    from backend.database import db
    await db.create_save(
        save_id=save_id,
        game_id=game_id,
        name=req.name,
        state_json=state.model_dump_json(),
    )
    return {"save_id": save_id, "name": req.name}


@app.get("/api/game/saves")
async def list_saves():
    from backend.database import db
    saves = await db.list_saves()
    return {"saves": saves}


@app.post("/api/game/load/{save_id}")
async def load_save(save_id: str):
    from backend.database import db
    raw = await db.load_save(save_id)
    if not raw:
        raise HTTPException(status_code=404, detail="Save not found")
    state = GameState.model_validate_json(raw)
    _games[state.game_id] = state
    return {"game_id": state.game_id, "state": state.model_dump()}
