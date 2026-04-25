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

class SettingsUpdate(BaseModel):
    groq_api_key: str

@router.get("")
def get_settings():
    return {"api_key_set": bool(os.getenv("GROQ_API_KEY"))}

@router.post("")
def update_settings(data: SettingsUpdate):
    os.environ["GROQ_API_KEY"] = data.groq_api_key
    save_settings({"groq_api_key": data.groq_api_key})
    return {"ok": True}
