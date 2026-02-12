#!/bin/bash
set -e

echo "=== Bellum Mundi — Installation ==="
echo ""

# Check Ollama
if ! command -v ollama &> /dev/null; then
    echo "Ollama n'est pas installe. Installez-le depuis https://ollama.com"
    exit 1
fi
echo "[OK] Ollama detecte"

# Check models
MODELS=$(ollama list 2>/dev/null || true)
if [ -z "$MODELS" ]; then
    echo "Aucun modele Ollama trouve. Installation de mistral..."
    ollama pull mistral
fi
echo "[OK] Modeles Ollama disponibles"

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "Demarrage d'Ollama..."
    ollama serve &
    sleep 3
fi
echo "[OK] Ollama en cours d'execution"

# Backend setup
echo ""
echo "--- Configuration du backend ---"
cd backend
python3 -m venv venv 2>/dev/null || python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
echo "[OK] Backend configure"

# Frontend setup
echo ""
echo "--- Configuration du frontend ---"
cd frontend
npm install
cd ..
echo "[OK] Frontend configure"

echo ""
echo "=== Installation terminee ==="
echo ""
echo "Pour lancer le jeu :"
echo "  Terminal 1: cd backend && source venv/bin/activate && uvicorn backend.main:app --reload --port 8000"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Ou avec Docker: docker-compose up --build"
echo ""
echo "Ouvrez http://localhost:3000 dans votre navigateur."
