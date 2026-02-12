"""AI Advisor engine."""

from __future__ import annotations

from backend.models.game_state import GameState
from backend.llm import ollama_client
from backend.llm.prompts import advisor as advisor_prompt
from backend.llm import context_builder


async def ask_advisor(state: GameState, question: str) -> str:
    """Ask the AI advisor a question."""
    player = state.nations[state.player_nation_id]

    prompt = advisor_prompt.build_advisor_prompt(
        player_nation_name=player.name,
        current_date=state.current_date,
        player_nation_summary=context_builder.player_nation_summary(state),
        brief_world_state=context_builder.brief_world_state(state),
        recent_events_summary=context_builder.recent_events_str(state, max_events=5),
        question=question,
    )

    response = await ollama_client.generate(
        prompt=prompt,
        model=state.ollama_model,
        system=advisor_prompt.SYSTEM_PROMPT,
        temperature=0.6,
        max_tokens=1024,
    )

    return response.strip()
