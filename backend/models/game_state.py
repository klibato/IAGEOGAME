"""Pydantic models for the complete game state."""

from __future__ import annotations

import uuid
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Difficulty(str, Enum):
    VERY_EASY = "very_easy"
    EASY = "easy"
    NORMAL = "normal"
    HARD = "hard"
    IMPOSSIBLE = "impossible"


DIFFICULTY_DESCRIPTIONS = {
    Difficulty.VERY_EASY: (
        "Le joueur reussit presque tout. Les actions meme irrealistes fonctionnent. "
        "Les nations IA sont passives et reagissent peu. Le monde se plie aux desirs du joueur."
    ),
    Difficulty.EASY: (
        "Le joueur reussit facilement mais le monde ne se plie pas instantanement. "
        "Les echecs sont rares et sans grandes consequences. Les IA sont peu agressives."
    ),
    Difficulty.NORMAL: (
        "Simulation realiste. Les actions reussissent ou echouent selon leur plausibilite "
        "et la preparation. Les nations IA poursuivent activement leurs objectifs. "
        "Les consequences sont proportionnelles aux actions."
    ),
    Difficulty.HARD: (
        "Le joueur doit planifier en amont. Les echecs ont des consequences serieuses. "
        "Les IA adverses sont agressives et strategiques. Les allies sont moins fiables. "
        "Les actions non preparees echouent souvent."
    ),
    Difficulty.IMPOSSIBLE: (
        "Toute action majeure sans preparation massive echoue et cause des degats. "
        "Les allies sont faibles et peu fiables. Les ennemis sont puissants et coordonnes. "
        "Le moindre faux pas peut etre fatal. Seule une strategie parfaite peut reussir."
    ),
}

DIFFICULTY_CHAT_DESCRIPTIONS = {
    Difficulty.VERY_EASY: "Sois relativement accommodant. Fais des concessions facilement.",
    Difficulty.EASY: "Sois raisonnable. Les negociations aboutissent assez facilement.",
    Difficulty.NORMAL: "Sois realiste. Defends tes interets mais reste ouvert a la negociation.",
    Difficulty.HARD: "Sois dur en negociation. Exige des contreparties importantes. Sois mefiant.",
    Difficulty.IMPOSSIBLE: (
        "Sois extremement dur. Refuse presque tout. Exige des concessions enormes. "
        "Menace si necessaire. Le joueur doit se battre pour chaque accord."
    ),
}


class RelationType(str, Enum):
    ALLIED = "allied"
    FRIENDLY = "friendly"
    NEUTRAL = "neutral"
    TENSE = "tense"
    HOSTILE = "hostile"
    AT_WAR = "at_war"


class BattalionType(str, Enum):
    INFANTRY = "infantry"
    ARMOR = "armor"
    NAVAL = "naval"
    AIR = "air"


class BattalionStatus(str, Enum):
    DEPLOYED = "deployed"
    MOVING = "moving"
    ENGAGED = "engaged"
    RESERVE = "reserve"


class EventCategory(str, Enum):
    MILITARY = "military"
    DIPLOMATIC = "diplomatic"
    ECONOMIC = "economic"
    INTERNAL = "internal"
    GLOBAL = "global"


class Battalion(BaseModel):
    id: str = Field(default_factory=lambda: f"btn_{uuid.uuid4().hex[:8]}")
    name: str
    nation_id: str
    type: BattalionType
    strength: int
    region_id: str
    lat: float
    lng: float
    status: BattalionStatus = BattalionStatus.DEPLOYED


class Region(BaseModel):
    id: str
    name: str
    controlled_by: str
    geojson_feature_id: str
    population: int = 0
    terrain_type: str = "plain"
    strategic_value: float = 5.0
    resources: list[str] = Field(default_factory=list)
    has_capital: bool = False
    battalions_present: list[str] = Field(default_factory=list)


class Nation(BaseModel):
    id: str
    name: str
    color: str
    flag_url: Optional[str] = None
    leader: str
    government_type: str
    description: str = ""
    regions_controlled: list[str] = Field(default_factory=list)
    military_strength: float = 50.0
    economic_strength: float = 50.0
    stability: float = 50.0
    population: int = 0
    battalions: list[Battalion] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    is_player: bool = False


class MapChange(BaseModel):
    type: str  # transfer_region | move_battalion | create_battalion | destroy_battalion
    region_id: Optional[str] = None
    from_nation: Optional[str] = None
    to_nation: Optional[str] = None
    battalion_id: Optional[str] = None
    nation_id: Optional[str] = None
    name: Optional[str] = None
    battalion_type: Optional[str] = None
    strength: Optional[int] = None
    new_region_id: Optional[str] = None
    new_lat: Optional[float] = None
    new_lng: Optional[float] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class StatChange(BaseModel):
    nation_id: str
    military: Optional[float] = None
    economy: Optional[float] = None
    stability: Optional[float] = None


class RelationChange(BaseModel):
    nation_a: str
    nation_b: str
    new_relation: RelationType


class GameEvent(BaseModel):
    id: str = Field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:8]}")
    turn_number: int = 0
    date: str
    title: str
    description: str
    category: EventCategory = EventCategory.GLOBAL
    nations_involved: list[str] = Field(default_factory=list)
    map_changes: list[MapChange] = Field(default_factory=list)
    stat_changes: list[StatChange] = Field(default_factory=list)
    relation_changes: list[RelationChange] = Field(default_factory=list)


class War(BaseModel):
    id: str = Field(default_factory=lambda: f"war_{uuid.uuid4().hex[:8]}")
    name: str
    attackers: list[str]
    defenders: list[str]
    start_date: str


class Alliance(BaseModel):
    id: str = Field(default_factory=lambda: f"all_{uuid.uuid4().hex[:8]}")
    name: str
    members: list[str]
    start_date: str


class Treaty(BaseModel):
    id: str = Field(default_factory=lambda: f"trt_{uuid.uuid4().hex[:8]}")
    name: str
    signatories: list[str]
    terms: str
    start_date: str


class PlayerAction(BaseModel):
    id: str = Field(default_factory=lambda: f"act_{uuid.uuid4().hex[:8]}")
    text: str
    submitted_at_turn: int = 0


class ChatMessage(BaseModel):
    sender: str  # nation_id or "player"
    content: str
    timestamp: str  # in-game date


class GameState(BaseModel):
    game_id: str = Field(default_factory=lambda: uuid.uuid4().hex[:12])
    preset_id: str
    current_date: str
    start_date: str
    turn_number: int = 0
    difficulty: Difficulty = Difficulty.NORMAL
    player_nation_id: str
    nations: dict[str, Nation] = Field(default_factory=dict)
    regions: dict[str, Region] = Field(default_factory=dict)
    events_log: list[GameEvent] = Field(default_factory=list)
    consolidated_summary: str = ""
    diplomatic_relations: dict[str, dict[str, RelationType]] = Field(default_factory=dict)
    active_wars: list[War] = Field(default_factory=list)
    active_alliances: list[Alliance] = Field(default_factory=list)
    active_treaties: list[Treaty] = Field(default_factory=list)
    world_before: str = ""
    simulation_rules: str = ""
    pending_actions: list[PlayerAction] = Field(default_factory=list)
    chat_histories: dict[str, list[ChatMessage]] = Field(default_factory=dict)
    ollama_model: str = "mistral"
