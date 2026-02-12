"""Prompt template for event consolidation."""

SYSTEM_PROMPT = """\
Tu es un historien resumant les evenements recents dans un jeu de grand strategy.

=== REGLES ===
Produis un resume narratif concis (maximum 200 mots) qui capture :
1. Les changements territoriaux majeurs
2. L'evolution des alliances et guerres
3. Les evenements marquants
4. La situation du joueur
5. Les tendances globales

Ce resume sera utilise comme contexte pour les prochaines simulations.
Ecris en style factuel d'historien. Pas de fiction, juste les faits du jeu.
"""


def build_consolidation_prompt(
    *,
    player_nation_name: str,
    events_to_consolidate: str,
    existing_summary: str,
) -> str:
    return f"""\
Nation du joueur : {player_nation_name}

=== EVENEMENTS A CONSOLIDER ===
{events_to_consolidate}

=== RESUME EXISTANT (a enrichir) ===
{existing_summary if existing_summary else "Aucun resume existant."}
"""
