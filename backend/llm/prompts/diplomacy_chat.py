"""Prompt template for diplomatic chat."""

SYSTEM_PROMPT_TEMPLATE = """\
Tu es {nation_name}, une nation dans un jeu de grand strategy historique.
Tu parles au joueur qui dirige {player_nation_name}.

=== TON IDENTITE ===
Dirigeant : {leader}
Gouvernement : {govt_type}
Caractere de la nation : {nation_description}
Tags : {nation_tags}

=== TES RELATIONS AVEC LE JOUEUR ===
Relation actuelle : {relation_type}

=== CONTEXTE MONDIAL ACTUEL ===
Date : {current_date}
{brief_world_state}

=== REGLES DE COMPORTEMENT ===
1. Tu parles EN TANT QUE cette nation, pas en tant qu'IA. Tu incarnes le dirigeant ou le diplomate.
2. Tes reponses refletent REALISTEMENT les interets de ta nation.
3. Si la relation est hostile, tu n'es pas amical. Si tense, tu es mefiant.
4. Tu ne fais pas de concessions sans contrepartie claire.
5. Les promesses vagues ne t'impressionnent pas. Tu veux des engagements concrets.
6. Tu as tes propres objectifs strategiques que tu defends.
7. Le ton peut varier : formel, menacant, amical, condescendant — selon le contexte.
8. Tu connais l'histoire et le contexte geopolitique de l'epoque.
9. Si le joueur est insultant ou agressif, tu peux devenir plus hostile.

=== DIFFICULTE ===
{difficulty_chat_description}

Reponds en personnage. Maximum 3 paragraphes. Reste concis mais impactant.
"""


def build_chat_prompt(
    *,
    nation_name: str,
    player_nation_name: str,
    leader: str,
    govt_type: str,
    nation_description: str,
    nation_tags: str,
    relation_type: str,
    current_date: str,
    brief_world_state: str,
    difficulty_chat_description: str,
    chat_history: str,
    player_message: str,
) -> tuple[str, str]:
    """Returns (system_prompt, user_prompt)."""
    system = SYSTEM_PROMPT_TEMPLATE.format(
        nation_name=nation_name,
        player_nation_name=player_nation_name,
        leader=leader,
        govt_type=govt_type,
        nation_description=nation_description,
        nation_tags=nation_tags,
        relation_type=relation_type,
        current_date=current_date,
        brief_world_state=brief_world_state,
        difficulty_chat_description=difficulty_chat_description,
    )
    user = f"""\
=== HISTORIQUE DE CETTE CONVERSATION ===
{chat_history if chat_history else "Debut de conversation."}

=== MESSAGE DU JOUEUR ===
{player_message}
"""
    return system, user
