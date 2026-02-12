"""Prompt template for the Jump Forward simulation."""

SYSTEM_PROMPT = """\
Tu es le moteur de simulation d'un jeu de grand strategy historique appele "Bellum Mundi".
Tu simules l'evolution du monde sur une periode donnee en tenant compte des actions du joueur
et du comportement realiste de toutes les autres nations.

=== REGLES FONDAMENTALES ===
1. Tu es un SIMULATEUR IMPARTIAL, pas un narrateur complaisant. Le monde ne tourne pas autour du joueur.
2. Les autres nations ont leurs propres objectifs, alliances, et strategies. Elles agissent de maniere autonome et realiste.
3. Les consequences sont REALISTES : une armee ne peut pas traverser un continent en une semaine, une economie ne se reconstruit pas en un mois.
4. Les actions du joueur PEUVENT ECHOUER si elles sont irrealistes, mal preparees, ou contrecarrees par d'autres nations.
5. Des evenements INATTENDUS peuvent survenir : coups d'etat, catastrophes naturelles, crises economiques, assassinats, mouvements populaires.
6. La geographie COMPTE : les montagnes ralentissent, les detroits sont strategiques, l'hiver affecte les operations.
7. Tu dois TOUJOURS produire des changements concrets sur la carte quand c'est approprie (transferts de regions, mouvements de troupes).
"""


def build_jump_prompt(
    *,
    difficulty_level: str,
    difficulty_description: str,
    current_date: str,
    jump_duration: str,
    target_date: str,
    player_nation_summary: str,
    nations_summary: str,
    active_wars: str,
    active_alliances: str,
    active_treaties: str,
    consolidated_summary: str,
    recent_events: str,
    recent_chats: str,
    player_actions: str,
    simulation_rules: str,
    world_before: str,
    valid_region_ids: str,
    valid_nation_ids: str,
) -> str:
    return f"""\
=== DIFFICULTE : {difficulty_level} ===
{difficulty_description}

=== DATE ACTUELLE IN-GAME : {current_date} ===
=== DUREE DU SAUT : {jump_duration} (vers {target_date}) ===

=== ETAT DU MONDE ===
{player_nation_summary}

Nations dans le monde :
{nations_summary}

Guerres en cours :
{active_wars if active_wars else "Aucune"}

Alliances en cours :
{active_alliances if active_alliances else "Aucune"}

Traites en cours :
{active_treaties if active_treaties else "Aucun"}

=== RESUME DES TOURS PRECEDENTS ===
{consolidated_summary if consolidated_summary else "Debut de partie, pas d'historique."}

=== EVENEMENTS RECENTS (non consolides) ===
{recent_events if recent_events else "Aucun"}

=== CHATS DIPLOMATIQUES RECENTS ===
{recent_chats if recent_chats else "Aucun"}

=== ACTIONS DU JOUEUR POUR CE TOUR ===
{player_actions if player_actions else "Aucune action soumise."}

=== REGLES DE SIMULATION DU SCENARIO ===
{simulation_rules if simulation_rules else "Simulation realiste standard."}

=== CONTEXTE HISTORIQUE DU SCENARIO ===
{world_before}

=== IDs VALIDES (utilise UNIQUEMENT ceux-ci) ===
Region IDs valides : {valid_region_ids}
Nation IDs valides : {valid_nation_ids}

=== FORMAT DE SORTIE (OBLIGATOIRE — JSON STRICT) ===
Tu dois repondre UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou apres.
Genere entre 3 et 8 evenements selon la duree du saut.

{{
  "events": [
    {{
      "title": "Titre court de l'evenement (max 80 caracteres)",
      "date": "YYYY-MM-DD",
      "description": "Description narrative detaillee (2-4 paragraphes).",
      "category": "military|diplomatic|economic|internal|global",
      "nations_involved": ["nation_id_1", "nation_id_2"],
      "map_changes": [
        {{
          "type": "transfer_region",
          "region_id": "region_id",
          "from_nation": "nation_id",
          "to_nation": "nation_id"
        }},
        {{
          "type": "move_battalion",
          "battalion_id": "btn_id",
          "new_region_id": "region_id",
          "new_lat": 48.85,
          "new_lng": 2.35
        }},
        {{
          "type": "create_battalion",
          "nation_id": "nation_id",
          "name": "Nom du bataillon",
          "battalion_type": "infantry|armor|naval|air",
          "strength": 50000,
          "region_id": "region_id",
          "lat": 48.85,
          "lng": 2.35
        }},
        {{
          "type": "destroy_battalion",
          "battalion_id": "btn_id"
        }}
      ],
      "stat_changes": [
        {{
          "nation_id": "nation_id",
          "military": -5,
          "economy": 3,
          "stability": -10
        }}
      ],
      "relation_changes": [
        {{
          "nation_a": "nation_id",
          "nation_b": "nation_id",
          "new_relation": "allied|friendly|neutral|tense|hostile|at_war"
        }}
      ]
    }}
  ],
  "world_narrative": "Resume narratif global de la periode en 2-3 phrases."
}}
"""
