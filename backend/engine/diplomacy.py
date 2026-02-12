"""Diplomacy chat engine."""

from __future__ import annotations

from backend.models.game_state import GameState, ChatMessage
from backend.llm import ollama_client
from backend.llm.prompts import diplomacy_chat
from backend.llm import context_builder


async def send_diplomatic_message(
    state: GameState,
    target_nation_id: str,
    player_message: str,
) -> str:
    """Send a diplomatic message and get the AI nation's response."""
    target = state.nations.get(target_nation_id)
    if not target:
        raise ValueError(f"Nation {target_nation_id} not found")

    player_nation = state.nations[state.player_nation_id]
    relation = state.diplomatic_relations.get(
        state.player_nation_id, {}
    ).get(target_nation_id, "neutral")

    # Build chat history string
    history = state.chat_histories.get(target_nation_id, [])
    chat_history_str = "\n".join(
        f"{'Joueur' if m.sender == 'player' else target.name}: {m.content}"
        for m in history[-10:]
    )

    system, prompt = diplomacy_chat.build_chat_prompt(
        nation_name=target.name,
        player_nation_name=player_nation.name,
        leader=target.leader,
        govt_type=target.government_type,
        nation_description=target.description,
        nation_tags=", ".join(target.tags) if target.tags else "none",
        relation_type=str(relation),
        current_date=state.current_date,
        brief_world_state=context_builder.brief_world_state(state),
        difficulty_chat_description=context_builder.difficulty_chat_description(state),
        chat_history=chat_history_str,
        player_message=player_message,
    )

    response = await ollama_client.generate(
        prompt=prompt,
        model=state.ollama_model,
        system=system,
        temperature=0.7,
        max_tokens=1024,
    )

    # Store messages in chat history
    if target_nation_id not in state.chat_histories:
        state.chat_histories[target_nation_id] = []

    state.chat_histories[target_nation_id].append(
        ChatMessage(sender="player", content=player_message, timestamp=state.current_date)
    )
    state.chat_histories[target_nation_id].append(
        ChatMessage(sender=target_nation_id, content=response.strip(), timestamp=state.current_date)
    )

    return response.strip()
