"""Event consolidation engine."""

from __future__ import annotations

from backend.models.game_state import GameState
from backend.llm import ollama_client
from backend.llm.prompts import consolidator as consolidator_prompt

CONSOLIDATION_INTERVAL = 3  # Consolidate every N turns


async def maybe_consolidate(state: GameState) -> bool:
    """Consolidate events if enough turns have passed. Returns True if consolidated."""
    if state.turn_number == 0 or state.turn_number % CONSOLIDATION_INTERVAL != 0:
        return False

    if not state.events_log:
        return False

    player = state.nations[state.player_nation_id]

    events_str = "\n\n".join(
        f"[{e.date}] {e.title}\n{e.description}" for e in state.events_log
    )

    prompt = consolidator_prompt.build_consolidation_prompt(
        player_nation_name=player.name,
        events_to_consolidate=events_str,
        existing_summary=state.consolidated_summary,
    )

    response = await ollama_client.generate(
        prompt=prompt,
        model=state.ollama_model,
        system=consolidator_prompt.SYSTEM_PROMPT,
        temperature=0.3,
        max_tokens=512,
    )

    state.consolidated_summary = response.strip()
    # Keep only the last few events, rest are consolidated
    state.events_log = state.events_log[-5:]

    return True
