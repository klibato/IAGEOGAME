"""Build context strings from GameState for LLM prompts."""

from __future__ import annotations

from backend.models.game_state import (
    GameState,
    Nation,
    DIFFICULTY_DESCRIPTIONS,
    DIFFICULTY_CHAT_DESCRIPTIONS,
)


def nation_summary(nation: Nation) -> str:
    battalions_detail = ", ".join(
        f"{b.name}({b.type.value},{b.strength})" for b in nation.battalions
    ) or "none"
    return (
        f"- {nation.name} ({nation.id}): "
        f"Dirigeant: {nation.leader}, Gouvernement: {nation.government_type}, "
        f"Militaire: {nation.military_strength}/100, "
        f"Economie: {nation.economic_strength}/100, "
        f"Stabilite: {nation.stability}/100, "
        f"Regions: {', '.join(nation.regions_controlled)}, "
        f"Bataillons: {len(nation.battalions)} ({battalions_detail}), "
        f"Tags: {', '.join(nation.tags) if nation.tags else 'none'}"
    )


def player_nation_summary(state: GameState) -> str:
    pn = state.nations[state.player_nation_id]
    return (
        f"Le joueur controle : {pn.name} ({pn.id})\n"
        f"Dirigeant : {pn.leader}\n"
        f"Gouvernement : {pn.government_type}\n"
        f"Force militaire : {pn.military_strength}/100\n"
        f"Force economique : {pn.economic_strength}/100\n"
        f"Stabilite : {pn.stability}/100\n"
        f"Population : {pn.population:,}\n"
        f"Regions : {', '.join(pn.regions_controlled)}\n"
        f"Tags : {', '.join(pn.tags) if pn.tags else 'aucun'}"
    )


def all_nations_summary(state: GameState) -> str:
    lines = []
    for nid, n in state.nations.items():
        rel = state.diplomatic_relations.get(state.player_nation_id, {}).get(nid, "neutral")
        line = nation_summary(n) + f", Relation avec le joueur: {rel}"
        lines.append(line)
    return "\n".join(lines)


def brief_world_state(state: GameState) -> str:
    """Short world state for chat/advisor prompts."""
    lines = []
    for nid, n in state.nations.items():
        lines.append(f"- {n.name}: Mil {n.military_strength}/100, Eco {n.economic_strength}/100, Stab {n.stability}/100")
    wars = ", ".join(w.name for w in state.active_wars) or "Aucune"
    alliances = ", ".join(a.name for a in state.active_alliances) or "Aucune"
    return f"Nations:\n" + "\n".join(lines) + f"\nGuerres: {wars}\nAlliances: {alliances}"


def active_wars_str(state: GameState) -> str:
    if not state.active_wars:
        return ""
    lines = []
    for w in state.active_wars:
        attackers = ", ".join(w.attackers)
        defenders = ", ".join(w.defenders)
        lines.append(f"- {w.name}: {attackers} vs {defenders} (depuis {w.start_date})")
    return "\n".join(lines)


def active_alliances_str(state: GameState) -> str:
    if not state.active_alliances:
        return ""
    return "\n".join(
        f"- {a.name}: {', '.join(a.members)}" for a in state.active_alliances
    )


def active_treaties_str(state: GameState) -> str:
    if not state.active_treaties:
        return ""
    return "\n".join(
        f"- {t.name}: {', '.join(t.signatories)} — {t.terms}" for t in state.active_treaties
    )


def recent_events_str(state: GameState, max_events: int = 10) -> str:
    recent = state.events_log[-max_events:] if state.events_log else []
    if not recent:
        return ""
    return "\n".join(
        f"[{e.date}] {e.title}: {e.description[:200]}" for e in recent
    )


def recent_chats_summary(state: GameState) -> str:
    lines = []
    for nid, msgs in state.chat_histories.items():
        if msgs:
            last_msgs = msgs[-3:]
            nation_name = state.nations.get(nid, None)
            name = nation_name.name if nation_name else nid
            for m in last_msgs:
                sender = "Joueur" if m.sender == "player" else name
                lines.append(f"[{sender}]: {m.content[:100]}")
    return "\n".join(lines) if lines else ""


def player_actions_str(state: GameState) -> str:
    if not state.pending_actions:
        return ""
    return "\n".join(
        f"- {a.text}" for a in state.pending_actions
    )


def difficulty_description(state: GameState) -> str:
    return DIFFICULTY_DESCRIPTIONS.get(state.difficulty, "")


def difficulty_chat_description(state: GameState) -> str:
    return DIFFICULTY_CHAT_DESCRIPTIONS.get(state.difficulty, "")


def valid_region_ids(state: GameState) -> str:
    return ", ".join(state.regions.keys())


def valid_nation_ids(state: GameState) -> str:
    return ", ".join(state.nations.keys())
