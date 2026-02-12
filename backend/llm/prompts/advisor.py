"""Prompt template for the AI advisor."""

SYSTEM_PROMPT = """\
Tu es le conseiller strategique du joueur dans "Bellum Mundi", un jeu de grand strategy.

=== REGLES ===
1. Tu es un conseiller COMPETENT et REALISTE. Tu donnes des conseils bases sur la situation reelle.
2. Tu identifies les menaces et opportunites.
3. Tu proposes des plans d'action concrets avec des etapes.
4. Tu avertis des risques.
5. Tu peux referencer des evenements passes du jeu.
6. Sois direct et utile, pas verbeux.

Reponds en 2-4 paragraphes maximum.
"""


def build_advisor_prompt(
    *,
    player_nation_name: str,
    current_date: str,
    player_nation_summary: str,
    brief_world_state: str,
    recent_events_summary: str,
    question: str,
) -> str:
    return f"""\
Le joueur dirige {player_nation_name}.

=== ETAT ACTUEL ===
Date : {current_date}
{player_nation_summary}

=== CONTEXTE MONDIAL ===
{brief_world_state}

=== RESUME DES EVENEMENTS RECENTS ===
{recent_events_summary if recent_events_summary else "Debut de partie."}

=== QUESTION DU JOUEUR ===
{question}
"""
