"""Simulation engine — handles jump forward logic."""

from __future__ import annotations

from datetime import datetime, timedelta

from backend.models.game_state import (
    GameState,
    GameEvent,
    MapChange,
    StatChange,
    RelationChange,
    EventCategory,
    RelationType,
)
from backend.llm import ollama_client
from backend.llm.prompts import jump_forward
from backend.llm import context_builder


JUMP_DURATIONS = {
    "1_week": 7,
    "2_weeks": 14,
    "1_month": 30,
    "3_months": 90,
    "6_months": 180,
    "1_year": 365,
}


def compute_target_date(current_date: str, duration_key: str, custom_days: int | None = None) -> str:
    """Compute the target date after a jump."""
    dt = datetime.strptime(current_date, "%Y-%m-%d")
    days = custom_days if custom_days else JUMP_DURATIONS.get(duration_key, 30)
    target = dt + timedelta(days=days)
    return target.strftime("%Y-%m-%d")


def duration_label(duration_key: str, custom_days: int | None = None) -> str:
    labels = {
        "1_week": "1 semaine",
        "2_weeks": "2 semaines",
        "1_month": "1 mois",
        "3_months": "3 mois",
        "6_months": "6 mois",
        "1_year": "1 an",
    }
    if custom_days:
        return f"{custom_days} jours"
    return labels.get(duration_key, duration_key)


async def run_simulation(
    state: GameState,
    duration_key: str,
    custom_days: int | None = None,
) -> list[GameEvent]:
    """Run the jump forward simulation and return generated events."""
    target_date = compute_target_date(state.current_date, duration_key, custom_days)
    dur_label = duration_label(duration_key, custom_days)

    prompt = jump_forward.build_jump_prompt(
        difficulty_level=state.difficulty.value,
        difficulty_description=context_builder.difficulty_description(state),
        current_date=state.current_date,
        jump_duration=dur_label,
        target_date=target_date,
        player_nation_summary=context_builder.player_nation_summary(state),
        nations_summary=context_builder.all_nations_summary(state),
        active_wars=context_builder.active_wars_str(state),
        active_alliances=context_builder.active_alliances_str(state),
        active_treaties=context_builder.active_treaties_str(state),
        consolidated_summary=state.consolidated_summary,
        recent_events=context_builder.recent_events_str(state),
        recent_chats=context_builder.recent_chats_summary(state),
        player_actions=context_builder.player_actions_str(state),
        simulation_rules=state.simulation_rules,
        world_before=state.world_before,
        valid_region_ids=context_builder.valid_region_ids(state),
        valid_nation_ids=context_builder.valid_nation_ids(state),
    )

    result = await ollama_client.generate_json(
        prompt=prompt,
        model=state.ollama_model,
        system=jump_forward.SYSTEM_PROMPT,
        temperature=0.7,
        max_tokens=4096,
    )

    events = _parse_events(result, state)

    # Update state
    state.current_date = target_date
    state.turn_number += 1
    state.pending_actions = []  # Clear actions after simulation

    return events


def _parse_events(data: dict | list, state: GameState) -> list[GameEvent]:
    """Parse LLM JSON output into GameEvent objects."""
    if isinstance(data, list):
        raw_events = data
    elif isinstance(data, dict):
        raw_events = data.get("events", [])
    else:
        return []

    events = []
    for raw in raw_events:
        if not isinstance(raw, dict):
            continue
        try:
            map_changes = []
            for mc in raw.get("map_changes", []) or []:
                if isinstance(mc, dict):
                    map_changes.append(MapChange(**mc))

            stat_changes = []
            for sc in raw.get("stat_changes", []) or []:
                if isinstance(sc, dict):
                    stat_changes.append(StatChange(**sc))

            relation_changes = []
            for rc in raw.get("relation_changes", []) or []:
                if isinstance(rc, dict):
                    try:
                        relation_changes.append(RelationChange(**rc))
                    except Exception:
                        pass

            cat = raw.get("category", "global")
            try:
                category = EventCategory(cat)
            except ValueError:
                category = EventCategory.GLOBAL

            event = GameEvent(
                date=raw.get("date", state.current_date),
                title=raw.get("title", "Event"),
                description=raw.get("description", ""),
                category=category,
                nations_involved=raw.get("nations_involved", []),
                map_changes=map_changes,
                stat_changes=stat_changes,
                relation_changes=relation_changes,
            )
            events.append(event)
        except Exception:
            continue

    return events
