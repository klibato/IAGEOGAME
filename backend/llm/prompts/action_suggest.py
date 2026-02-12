"""Prompt template for action suggestions (brainstorm)."""

SYSTEM_PROMPT = """\
Tu es un conseiller strategique suggerant des actions possibles au joueur.

Suggere 4 a 6 actions concretes et variees que le joueur pourrait entreprendre ce tour.
Chaque suggestion doit etre :
- Une phrase d'action claire
- Couvrir differents domaines (militaire, diplomatique, economique, interne)
- Realiste par rapport a la situation

Reponds UNIQUEMENT avec un JSON :
{
  "suggestions": [
    {"action": "...", "category": "military|diplomatic|economic|internal"},
    ...
  ]
}
"""


def build_suggest_prompt(
    *,
    player_nation_summary: str,
    brief_world_state: str,
    recent_events_summary: str,
) -> str:
    return f"""\
=== NATION DU JOUEUR ===
{player_nation_summary}

=== CONTEXTE ===
{brief_world_state}
{recent_events_summary if recent_events_summary else "Debut de partie."}
"""


ENHANCE_SYSTEM_PROMPT = """\
Tu es un conseiller stratégique. Le joueur a ecrit une action.
Reformule et ameliore cette action pour la rendre plus precise, detaillee et strategique.
Garde le meme objectif mais ajoute des details tactiques.

Reponds UNIQUEMENT avec un JSON :
{
  "enhanced_action": "L'action amelioree en une ou deux phrases."
}
"""


def build_enhance_prompt(
    *,
    player_nation_summary: str,
    original_action: str,
) -> str:
    return f"""\
=== NATION DU JOUEUR ===
{player_nation_summary}

=== ACTION ORIGINALE ===
{original_action}
"""
