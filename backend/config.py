from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"

    # Model configuration
    debate_model: str = "claude-opus-4-6"
    analysis_model: str = "claude-opus-4-6"
    fast_model: str = "claude-sonnet-4-5-20250929"

    # Debate settings
    debate_temperature: float = 0.85
    max_tokens_per_turn: int = 400

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
