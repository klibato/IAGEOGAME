"""Action processing — brainstorm suggestions and enhance actions."""

from __future__ import annotations

from backend.models.game_state import GameState
from backend.llm import ollama_client
from backend.llm.prompts import action_suggest
from backend.llm import context_builder


async def brainstorm_actions(state: GameState) -> list[dict]:
    """Generate action suggestions for the player."""
    player = state.nations[state.player_nation_id]

    prompt = action_suggest.build_suggest_prompt(
        player_nation_summary=context_builder.player_nation_summary(state),
        brief_world_state=context_builder.brief_world_state(state),
        recent_events_summary=context_builder.recent_events_str(state, max_events=5),
    )

    result = await ollama_client.generate_json(
        prompt=prompt,
        model=state.ollama_model,
        system=action_suggest.SYSTEM_PROMPT,
        temperature=0.7,
        max_tokens=1024,
    )

    suggestions = result.get("suggestions", []) if isinstance(result, dict) else []
    return suggestions


async def enhance_action(state: GameState, action_text: str) -> str:
    """Enhance/improve a player action."""
    prompt = action_suggest.build_enhance_prompt(
        player_nation_summary=context_builder.player_nation_summary(state),
        original_action=action_text,
    )

    result = await ollama_client.generate_json(
        prompt=prompt,
        model=state.ollama_model,
        system=action_suggest.ENHANCE_SYSTEM_PROMPT,
        temperature=0.5,
        max_tokens=512,
    )

    if isinstance(result, dict):
        return result.get("enhanced_action", action_text)
    return action_text
