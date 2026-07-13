from fastapi import APIRouter
from pydantic import BaseModel
import os
import json

router = APIRouter()

SETTINGS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "settings.json")

def load_settings() -> dict:
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, "r") as f:
            return json.load(f)
    return {}

def save_settings(data: dict):
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    with open(SETTINGS_FILE, "w") as f:
        json.dump(data, f)

# Load saved key on startup
_saved = load_settings()
if _saved.get("groq_api_key"):
    os.environ["GROQ_API_KEY"] = _saved["groq_api_key"]

GROQ_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"]
DEFAULT_MODEL = "llama-3.3-70b-versatile"

from typing import Optional

class SettingsUpdate(BaseModel):
    groq_api_key: Optional[str] = None
    groq_model: Optional[str] = None

@router.get("")
def get_settings():
    s = load_settings()
    return {
        "api_key_set": bool(os.getenv("GROQ_API_KEY")),
        "groq_model": s.get("groq_model", DEFAULT_MODEL),
        "available_models": GROQ_MODELS
    }

@router.get("/test")
def test_connection():
    key = os.getenv("GROQ_API_KEY", "")
    if not key:
        return {"ok": False, "error": "API key non configurata"}
    try:
        from groq import Groq
        model = os.getenv("GROQ_MODEL", DEFAULT_MODEL)
        client = Groq(api_key=key)
        client.chat.completions.create(
            model=model, max_tokens=5,
            messages=[{"role": "user", "content": "ping"}]
        )
        return {"ok": True, "model": model}
    except Exception as e:
        return {"ok": False, "error": str(e)[:120]}

@router.post("")
def update_settings(data: SettingsUpdate):
    s = load_settings()
    if data.groq_api_key is not None:
        os.environ["GROQ_API_KEY"] = data.groq_api_key
        s["groq_api_key"] = data.groq_api_key
    if data.groq_model and data.groq_model in GROQ_MODELS:
        s["groq_model"] = data.groq_model
        os.environ["GROQ_MODEL"] = data.groq_model
    save_settings(s)
    return {"ok": True}
