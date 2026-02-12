"""Core game engine — creates games, applies events, manages state."""

from __future__ import annotations

import json
import uuid
from pathlib import Path

from backend.models.game_state import (
    GameState,
    Nation,
    Region,
    Battalion,
    GameEvent,
    MapChange,
    PlayerAction,
    War,
    Alliance,
    Treaty,
    RelationType,
    Difficulty,
    BattalionType,
    BattalionStatus,
)
from backend.database import db


PRESETS_DIR = Path(__file__).parent.parent / "data" / "presets"


def list_presets() -> list[dict]:
    """List all available presets."""
    presets = []
    for p in PRESETS_DIR.glob("*.json"):
        with open(p) as f:
            data = json.load(f)
            presets.append({
                "id": data["id"],
                "name": data["name"],
                "description": data.get("description", ""),
                "start_date": data.get("start_date", ""),
                "nations": list(data.get("nations", {}).keys()),
            })
    return presets


def load_preset(preset_id: str) -> dict:
    """Load a preset JSON file."""
    path = PRESETS_DIR / f"{preset_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"Preset {preset_id} not found")
    with open(path) as f:
        return json.load(f)


def create_game(
    preset_id: str,
    player_nation_id: str,
    difficulty: str = "normal",
    ollama_model: str = "mistral",
) -> GameState:
    """Create a new game from a preset."""
    preset = load_preset(preset_id)

    nations = {}
    for nid, ndata in preset["nations"].items():
        battalions = []
        for bdata in ndata.get("battalions", []):
            battalions.append(Battalion(
                id=bdata.get("id", f"btn_{uuid.uuid4().hex[:8]}"),
                name=bdata["name"],
                nation_id=nid,
                type=BattalionType(bdata.get("type", "infantry")),
                strength=bdata.get("strength", 10000),
                region_id=bdata.get("region_id", ""),
                lat=bdata.get("lat", 0),
                lng=bdata.get("lng", 0),
                status=BattalionStatus(bdata.get("status", "deployed")),
            ))
        nations[nid] = Nation(
            id=nid,
            name=ndata["name"],
            color=ndata.get("color", "#888888"),
            flag_url=ndata.get("flag_url"),
            leader=ndata.get("leader", "Unknown"),
            government_type=ndata.get("government_type", "Republic"),
            description=ndata.get("description", ""),
            regions_controlled=ndata.get("regions_controlled", []),
            military_strength=ndata.get("military_strength", 50),
            economic_strength=ndata.get("economic_strength", 50),
            stability=ndata.get("stability", 50),
            population=ndata.get("population", 0),
            battalions=battalions,
            tags=ndata.get("tags", []),
            is_player=(nid == player_nation_id),
        )

    regions = {}
    for rid, rdata in preset.get("regions", {}).items():
        regions[rid] = Region(
            id=rid,
            name=rdata["name"],
            controlled_by=rdata["controlled_by"],
            geojson_feature_id=rdata.get("geojson_feature_id", rid),
            population=rdata.get("population", 0),
            terrain_type=rdata.get("terrain_type", "plain"),
            strategic_value=rdata.get("strategic_value", 5),
            resources=rdata.get("resources", []),
            has_capital=rdata.get("has_capital", False),
        )

    # Build diplomatic relations
    relations: dict[str, dict[str, RelationType]] = {}
    for nid in nations:
        relations[nid] = {}
        for nid2 in nations:
            if nid != nid2:
                relations[nid][nid2] = RelationType.NEUTRAL
    # Apply preset relations — supports both list and dict formats
    raw_relations = preset.get("initial_relations", [])
    if isinstance(raw_relations, dict):
        # Dict format: {"nation_a-nation_b": {"status": "allied", ...}}
        for key, rdata in raw_relations.items():
            parts = key.split("-", 1)
            if len(parts) != 2:
                continue
            a, b = parts
            status = rdata.get("status", "neutral") if isinstance(rdata, dict) else str(rdata)
            try:
                rt = RelationType(status)
            except ValueError:
                rt = RelationType.NEUTRAL
            if a in relations:
                relations[a][b] = rt
            if b in relations:
                relations[b][a] = rt
    elif isinstance(raw_relations, list):
        for rel in raw_relations:
            a, b = rel["nation_a"], rel["nation_b"]
            rt = RelationType(rel["relation"])
            if a in relations:
                relations[a][b] = rt
            if b in relations:
                relations[b][a] = rt

    # Wars
    wars = [
        War(
            name=w["name"],
            attackers=w["attackers"],
            defenders=w["defenders"],
            start_date=w.get("start_date", preset["start_date"]),
        )
        for w in preset.get("initial_wars", [])
    ]

    # Alliances
    alliances = [
        Alliance(
            name=a["name"],
            members=a["members"],
            start_date=a.get("start_date", preset["start_date"]),
        )
        for a in preset.get("initial_alliances", [])
    ]

    state = GameState(
        preset_id=preset_id,
        current_date=preset["start_date"],
        start_date=preset["start_date"],
        difficulty=Difficulty(difficulty),
        player_nation_id=player_nation_id,
        nations=nations,
        regions=regions,
        diplomatic_relations=relations,
        active_wars=wars,
        active_alliances=alliances,
        world_before=preset.get("world_before", ""),
        simulation_rules=preset.get("simulation_rules", ""),
        ollama_model=ollama_model,
    )

    return state


def apply_event(state: GameState, event: GameEvent) -> GameState:
    """Apply a GameEvent's changes to the game state."""
    # Apply map changes
    for mc in event.map_changes:
        if mc.type == "transfer_region":
            _apply_transfer(state, mc)
        elif mc.type == "move_battalion":
            _apply_move(state, mc)
        elif mc.type == "create_battalion":
            _apply_create_battalion(state, mc)
        elif mc.type == "destroy_battalion":
            _apply_destroy_battalion(state, mc)

    # Apply stat changes
    for sc in event.stat_changes:
        nation = state.nations.get(sc.nation_id)
        if not nation:
            continue
        if sc.military is not None:
            nation.military_strength = max(0, min(100, nation.military_strength + sc.military))
        if sc.economy is not None:
            nation.economic_strength = max(0, min(100, nation.economic_strength + sc.economy))
        if sc.stability is not None:
            nation.stability = max(0, min(100, nation.stability + sc.stability))

    # Apply relation changes
    for rc in event.relation_changes:
        if rc.nation_a in state.diplomatic_relations:
            state.diplomatic_relations[rc.nation_a][rc.nation_b] = rc.new_relation
        if rc.nation_b in state.diplomatic_relations:
            state.diplomatic_relations[rc.nation_b][rc.nation_a] = rc.new_relation

    # Add event to log
    event.turn_number = state.turn_number
    state.events_log.append(event)

    return state


def _apply_transfer(state: GameState, mc: MapChange):
    """Transfer a region from one nation to another."""
    if not mc.region_id or not mc.to_nation:
        return
    region = state.regions.get(mc.region_id)
    if not region:
        return
    old_owner = region.controlled_by
    region.controlled_by = mc.to_nation

    # Update nation region lists
    if old_owner in state.nations and mc.region_id in state.nations[old_owner].regions_controlled:
        state.nations[old_owner].regions_controlled.remove(mc.region_id)
    if mc.to_nation in state.nations and mc.region_id not in state.nations[mc.to_nation].regions_controlled:
        state.nations[mc.to_nation].regions_controlled.append(mc.region_id)


def _apply_move(state: GameState, mc: MapChange):
    """Move a battalion to a new position."""
    if not mc.battalion_id:
        return
    for nation in state.nations.values():
        for btn in nation.battalions:
            if btn.id == mc.battalion_id:
                if mc.new_region_id:
                    btn.region_id = mc.new_region_id
                if mc.new_lat is not None:
                    btn.lat = mc.new_lat
                if mc.new_lng is not None:
                    btn.lng = mc.new_lng
                return


def _apply_create_battalion(state: GameState, mc: MapChange):
    """Create a new battalion."""
    if not mc.nation_id:
        return
    nation = state.nations.get(mc.nation_id)
    if not nation:
        return
    btn = Battalion(
        id=mc.battalion_id or f"btn_{uuid.uuid4().hex[:8]}",
        name=mc.name or "New Battalion",
        nation_id=mc.nation_id,
        type=BattalionType(mc.battalion_type) if mc.battalion_type else BattalionType.INFANTRY,
        strength=mc.strength or 10000,
        region_id=mc.region_id or "",
        lat=mc.lat or 0,
        lng=mc.lng or 0,
    )
    nation.battalions.append(btn)


def _apply_destroy_battalion(state: GameState, mc: MapChange):
    """Destroy a battalion."""
    if not mc.battalion_id:
        return
    for nation in state.nations.values():
        nation.battalions = [b for b in nation.battalions if b.id != mc.battalion_id]


async def persist_state(state: GameState):
    """Save game state to database."""
    await db.save_game_state(
        game_id=state.game_id,
        preset_id=state.preset_id,
        state_json=state.model_dump_json(),
    )


async def load_state(game_id: str) -> GameState | None:
    """Load game state from database."""
    raw = await db.load_game_state(game_id)
    if raw is None:
        return None
    return GameState.model_validate_json(raw)
