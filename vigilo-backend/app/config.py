from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_JWT_SECRET: str
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"

    CEREBRAS_API_KEY: str = ""
    CEREBRAS_MODEL: str = "llama3.1-8b"
    CEREBRAS_BASE_URL: str = "https://api.cerebras.ai/v1"

    NVIDIA_API_KEY: str = ""
    NVIDIA_MODEL: str = "meta/llama-3.1-70b-instruct"
    NVIDIA_BASE_URL: str = "https://integrate.api.nvidia.com/v1"

    LLM_PROVIDER_ORDER: str = "openai,groq,cerebras,nvidia"
    LLM_MAX_TOKENS: int = 220
    LLM_TEMPERATURE: float = 0.7
    LLM_TIMEOUT_SECONDS: float = 30.0

    APP_ENV: str = "development"
    ALLOW_DEV_AUTH_BYPASS: bool = True
    ALLOW_ORIGINS: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
