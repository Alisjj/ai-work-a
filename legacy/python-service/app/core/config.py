import secrets

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with validation."""

    # Database
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/briefings_db",
        description="Database connection URL",
    )

    # Server
    PORT: int = Field(default=8000, ge=1, le=65535, description="Server port")
    DEBUG: bool = Field(default=False, description="Debug mode")

    # Security
    API_KEY: str = Field(
        default_factory=lambda: secrets.token_urlsafe(32),
        description="API key for authentication",
    )

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = Field(
        default=60, ge=1, description="Requests per minute limit"
    )

    model_config = {"env_file": ".env", "extra": "ignore"}

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Validate that DATABASE_URL starts with a supported protocol."""
        if not v.startswith(("postgresql://", "sqlite://")):
            raise ValueError(
                "DATABASE_URL must start with 'postgresql://' or 'sqlite://'"
            )
        return v

    @property
    def is_postgres(self) -> bool:
        """Check if using PostgreSQL database."""
        return self.DATABASE_URL.startswith("postgresql://")


settings = Settings()
