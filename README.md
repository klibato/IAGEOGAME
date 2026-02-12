# Bellum Mundi

Grand strategy sandbox alimente par un LLM local. Clone open-source de Pax Historia, tournant 100% en local via Ollama.

## Fonctionnalites

- **Carte interactive** — Leaflet.js avec frontieres GeoJSON colorees par nation, bataillons visibles
- **Actions en langage naturel** — Ecrivez vos ordres (militaires, diplomatiques, economiques) librement
- **Simulation IA** — Jump Forward dans le temps, l'IA genere les evenements et consequences
- **Diplomatie** — Chat 1-a-1 avec les nations IA, negociations realistes
- **Conseiller IA** — Posez des questions strategiques, obtenez des analyses
- **Brainstorm** — L'IA suggere des actions possibles
- **5 niveaux de difficulte** — De Tres Facile a Impossible
- **Sauvegarde/Chargement** — Persistance SQLite

## Prerequis

- **Ollama** installe et fonctionnel (https://ollama.com)
- Au moins un modele telecharge (`ollama pull mistral`)
- **Python 3.11+**
- **Node.js 18+**

### Modeles recommandes

| Modele | Taille | Qualite | Vitesse |
|--------|--------|---------|---------|
| `mistral` | 7B | Correcte | Rapide |
| `llama3.1` | 8B | Bonne | Rapide |
| `qwen2.5:14b` | 14B | Tres bonne | Moyenne |
| `mistral-small` | 24B | Excellente | Lente |

## Installation rapide

```bash
chmod +x setup.sh
./setup.sh
```

## Lancement manuel

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
uvicorn backend.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Ouvrez http://localhost:3000

### Docker
```bash
docker-compose up --build
```

## Architecture

```
backend/          — FastAPI + Python
  models/         — Pydantic models (GameState, Nation, Region, etc.)
  engine/         — Game engine, simulation, diplomacy, advisor
  llm/            — Ollama client + prompt templates
  data/presets/   — Scenario JSON files
  database/       — SQLite persistence

frontend/         — React + TypeScript + Vite
  components/     — GameMap, ActionPanel, ChatPanel, etc.
  stores/         — Zustand state management
  utils/          — API client, map utilities
```

## Scenario inclus

- **Monde Moderne 2025** — 12 nations, guerre russo-ukrainienne, tensions geopolitiques contemporaines

## API

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/presets` | Liste des scenarios |
| POST | `/api/game/create` | Creer une partie |
| GET | `/api/game/{id}` | Etat du jeu |
| POST | `/api/game/{id}/action` | Soumettre une action |
| POST | `/api/game/{id}/jump` | Jump Forward (simulation) |
| POST | `/api/game/{id}/chat` | Chat diplomatique |
| POST | `/api/game/{id}/advisor` | Question au conseiller |
| POST | `/api/game/{id}/brainstorm` | Suggestions d'actions |
| POST | `/api/game/{id}/save` | Sauvegarder |
| GET | `/api/ollama/status` | Statut Ollama |

## Licence

MIT
