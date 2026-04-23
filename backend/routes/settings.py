from fastapi import APIRouter
from pydantic import BaseModel
import os

router = APIRouter()
_settings = {}

class SettingsUpdate(BaseModel):
    anthropic_api_key: str

@router.get("")
def get_settings():
    return {"api_key_set": bool(_settings.get("anthropic_api_key") or os.getenv("ANTHROPIC_API_KEY"))}

@router.post("")
def update_settings(data: SettingsUpdate):
    _settings["anthropic_api_key"] = data.anthropic_api_key
    os.environ["ANTHROPIC_API_KEY"] = data.anthropic_api_key
    return {"ok": True}
