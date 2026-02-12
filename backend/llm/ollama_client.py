"""Client for communicating with Ollama API."""

from __future__ import annotations

import json
import os
import re
from typing import AsyncIterator

import httpx
import json_repair


OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("OLLAMA_MODEL", "mistral")


async def list_models() -> list[dict]:
    """List available Ollama models."""
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(f"{OLLAMA_HOST}/api/tags")
            resp.raise_for_status()
            data = resp.json()
            return data.get("models", [])
        except Exception:
            return []


async def check_status() -> dict:
    """Check if Ollama is running."""
    async with httpx.AsyncClient(timeout=5) as client:
        try:
            resp = await client.get(f"{OLLAMA_HOST}/api/tags")
            resp.raise_for_status()
            return {"status": "ok", "models_count": len(resp.json().get("models", []))}
        except Exception as e:
            return {"status": "error", "error": str(e)}


async def generate(
    prompt: str,
    model: str = DEFAULT_MODEL,
    system: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> str:
    """Generate a completion from Ollama (non-streaming)."""
    payload: dict = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens,
        },
    }
    if system:
        payload["system"] = system

    async with httpx.AsyncClient(timeout=300) as client:
        resp = await client.post(f"{OLLAMA_HOST}/api/generate", json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data.get("response", "")


async def generate_stream(
    prompt: str,
    model: str = DEFAULT_MODEL,
    system: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
) -> AsyncIterator[str]:
    """Generate a streaming completion from Ollama."""
    payload: dict = {
        "model": model,
        "prompt": prompt,
        "stream": True,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens,
        },
    }
    if system:
        payload["system"] = system

    async with httpx.AsyncClient(timeout=300) as client:
        async with client.stream(
            "POST", f"{OLLAMA_HOST}/api/generate", json=payload
        ) as resp:
            async for line in resp.aiter_lines():
                if line.strip():
                    try:
                        chunk = json.loads(line)
                        token = chunk.get("response", "")
                        if token:
                            yield token
                    except json.JSONDecodeError:
                        continue


async def generate_json(
    prompt: str,
    model: str = DEFAULT_MODEL,
    system: str | None = None,
    temperature: float = 0.4,
    max_tokens: int = 4096,
    retries: int = 2,
) -> dict | list:
    """Generate JSON output from Ollama with robust parsing and retry.

    Attempts to parse the LLM response as JSON. If parsing fails,
    tries regex extraction and json_repair. Retries with a stricter
    prompt on failure.
    """
    for attempt in range(retries + 1):
        raw = await generate(
            prompt=prompt,
            model=model,
            system=system,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        result = _try_parse_json(raw)
        if result is not None:
            return result

        # Retry with stricter instruction
        if attempt < retries:
            prompt = (
                "Your previous response was not valid JSON. "
                "You MUST respond with ONLY a valid JSON object. "
                "No text before or after the JSON.\n\n" + prompt
            )
            temperature = max(0.1, temperature - 0.2)

    # Final fallback: return empty structure
    return {"events": [], "world_narrative": "Simulation error — no events generated."}


def _try_parse_json(raw: str) -> dict | list | None:
    """Try multiple strategies to extract JSON from LLM output."""
    text = raw.strip()

    # Strategy 1: direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Strategy 2: extract JSON block from markdown code fences
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Strategy 3: find first { ... } or [ ... ] block
    for start_char, end_char in [("{", "}"), ("[", "]")]:
        start = text.find(start_char)
        if start == -1:
            continue
        end = text.rfind(end_char)
        if end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                pass

    # Strategy 4: json_repair
    try:
        repaired = json_repair.repair_json(text, return_objects=True)
        if isinstance(repaired, (dict, list)):
            return repaired
    except Exception:
        pass

    return None
