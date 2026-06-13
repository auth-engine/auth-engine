from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env.local", env_prefix="", case_sensitive=True, extra="ignore"
    )

    # Application
    APP_NAME: str = "AuthEngine"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = (
        "Production-ready IAM system built with "
        "FastAPI — supports authentication, multi-tenancy, fine-grained permissions, "
        "and token introspection to power multiple apps from a unified identity layer."
    )
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    APP_URL: str = "http://localhost:3000"
    # Public URL of the dashboard / frontend used to build user-facing email links
    # (password reset, etc). Falls back to APP_URL when unset.
    DASHBOARD_URL: str = "http://localhost:3000"

    # Super Admin Bootstrap
    # Defaulting to values that should be changed in .env
    SUPERADMIN_EMAIL: str = "admin@authengine.org"
    SUPERADMIN_PASSWORD: str = "ChangeThisStrongPassword123!"

    # Security
    SECRET_KEY: str = Field(..., min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database URLs
    POSTGRES_URL: str = Field(..., description="PostgreSQL connection URL")
    MONGODB_URL: str = Field(..., description="MongoDB connection URL")
    REDIS_URL: str = Field(..., description="Redis connection URL")

    # PostgreSQL specific
    POSTGRES_POOL_SIZE: int = 20
    POSTGRES_MAX_OVERFLOW: int = 10

    # MongoDB specific
    MONGODB_DB_NAME: str = "authengine"

    # Redis specific
    REDIS_DB: int = 0
    REDIS_MAX_CONNECTIONS: int = 50

    # JWT Settings
    JWT_SECRET_KEY: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"
    JWT_ISSUER: str = "authengine"
    JWT_AUDIENCE: str = "authengine-api"

    # OIDC RS256 signing key (mount into the container; must be readable by the app user)
    OIDC_PRIVATE_KEY_PATH: str = "/app/oidc_private.pem"

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 10
    RATE_LIMIT_ENABLED: bool = True

    # Password Policy
    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_REQUIRE_UPPERCASE: bool = True
    PASSWORD_REQUIRE_LOWERCASE: bool = True
    PASSWORD_REQUIRE_DIGIT: bool = True
    PASSWORD_REQUIRE_SPECIAL: bool = True

    # Session Management
    MAX_CONCURRENT_SESSIONS: int = 5
    SESSION_TIMEOUT_MINUTES: int = 60

    # Email Settings
    EMAIL_PROVIDER: str = "ses"
    EMAIL_PROVIDER_API_KEY: str = Field(
        default="",
        description=(
            "Email provider credential. For SendGrid: the API key. For SES: optional "
            '"AWS_ACCESS_KEY_ID:AWS_SECRET_ACCESS_KEY" — leave blank to use the IAM role / '
            "default boto3 credential chain."
        ),
    )
    EMAIL_SENDER: str = Field(
        default="noreply@authengine.org", description="Default email sender (SES verified identity)"
    )

    # AWS (used by the SES email provider)
    AWS_REGION: str = Field(default="ap-south-1", description="AWS region for SES")

    # WebAuthn / Passkeys
    # Relying Party ID — use the registrable parent domain (e.g. authengine.org) so
    # passkeys work across app.* and auth.* subdomains. Empty -> derived from APP_URL host.
    WEBAUTHN_RP_ID: str = Field(default="", description="WebAuthn Relying Party ID")

    # SMS Settings
    SMS_PROVIDER: str = "android_gateway"
    SMS_PROVIDER_API_KEY: str = Field(
        default="", description="API Key or Secret for the configured SMS provider (e.g. Twilio)"
    )
    SMS_PROVIDER_ACCOUNT_SID: str = Field(default="", description="Account SID for Twilio if used")
    SMS_SENDER: str = Field(default="+1234567890", description="Default SMS sender number")

    # Android SMS Gateway (phone + SIM as the SMS gateway)
    SMS_GATEWAY_URL: str = Field(
        default="",
        description=(
            "Base URL of the Android SMS Gateway app. Local: http://<phone-ip>:8080 ; "
            "Cloud: https://api.sms-gate.app/3rdparty/v1"
        ),
    )
    SMS_GATEWAY_USERNAME: str = Field(default="", description="Android SMS Gateway basic-auth user")
    SMS_GATEWAY_PASSWORD: str = Field(default="", description="Android SMS Gateway basic-auth pass")

    # OAuth Settings
    GOOGLE_CLIENT_ID: str = Field(default="", description="Google OAuth Client ID")
    GOOGLE_CLIENT_SECRET: str = Field(default="", description="Google OAuth Client Secret")
    GOOGLE_REDIRECT_URI: str = Field(default="", description="Google OAuth Redirect URI")

    GITHUB_CLIENT_ID: str = Field(default="", description="GitHub OAuth Client ID")
    GITHUB_CLIENT_SECRET: str = Field(default="", description="GitHub OAuth Client Secret")
    GITHUB_REDIRECT_URI: str = Field(default="", description="GitHub OAuth Redirect URI")

    MICROSOFT_CLIENT_ID: str = Field(default="", description="Microsoft OAuth Client ID")
    MICROSOFT_CLIENT_SECRET: str = Field(default="", description="Microsoft OAuth Client Secret")
    MICROSOFT_REDIRECT_URI: str = Field(default="", description="Microsoft OAuth Redirect URI")

    # AuthEngine self-hosted OAuth Settings
    AUTHENGINE_BASE_URL: str = Field(default="", description="AuthEngine Base URL")
    AUTHENGINE_CLIENT_ID: str = Field(default="", description="AuthEngine Client ID")
    AUTHENGINE_CLIENT_SECRET: str = Field(default="", description="AuthEngine Client Secret")
    AUTHENGINE_REDIRECT_URI: str = Field(default="", description="AuthEngine Redirect URI")

    # CORS Settings
    CORS_ORIGINS: list[str] = Field(default=[], description="List of allowed origins for CORS")


settings = Settings()  # type: ignore[call-arg]
