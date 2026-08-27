import os
from dotenv import load_dotenv

# Load env variables from .env file if it exists
load_dotenv()

# Environment Modes: development | test | production
APP_ENV = os.getenv("APP_ENV", os.getenv("ENVIRONMENT", "development")).lower()
APP_MODE = os.getenv("APP_MODE", "production") # legacy mode compat
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# SQL System of Record (PostgreSQL in Production / SQLite in Development)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./gramx.db")
# If DATABASE_URL starts with postgres:// (Render standard), convert to postgresql:// for SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Database Connection Pool Settings (PostgreSQL)
DB_POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "10"))
DB_MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "20"))
DB_POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))
DB_POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "1800"))


# Authentication & Security
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key_for_gramx_mvp_token_signing_2026")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", "dev_refresh_token_signing_secret_gramx_2026")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))
PASSWORD_RESET_EXPIRE_MINUTES = int(os.getenv("PASSWORD_RESET_EXPIRE_MINUTES", "15"))

# MongoDB (Document Store for Dynamic Forms & Inspections)
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/gramx")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "gramx")

# Cloud Object / File Storage Configuration (S3 / Cloudflare R2 / MinIO / Local)
STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local")  # local, s3, minio, r2
LOCAL_STORAGE_DIR = os.getenv("LOCAL_STORAGE_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "media_storage")))
OBJECT_STORAGE_ENDPOINT = os.getenv("OBJECT_STORAGE_ENDPOINT", "")
OBJECT_STORAGE_BUCKET = os.getenv("OBJECT_STORAGE_BUCKET", "gramx-evidence")
OBJECT_STORAGE_ACCESS_KEY = os.getenv("OBJECT_STORAGE_ACCESS_KEY", "")
OBJECT_STORAGE_SECRET_KEY = os.getenv("OBJECT_STORAGE_SECRET_KEY", "")
OBJECT_STORAGE_REGION = os.getenv("OBJECT_STORAGE_REGION", "ap-south-1")
OBJECT_STORAGE_SECURE = os.getenv("OBJECT_STORAGE_SECURE", "true").lower() == "true"

# Real Speech-To-Text (STT) Service Configuration
STT_PROVIDER = os.getenv("STT_PROVIDER", "whisper_api")  # whisper_api, google_cloud, faster_whisper, offline_fallback
STT_API_KEY = os.getenv("STT_API_KEY", "")
STT_ENDPOINT = os.getenv("STT_ENDPOINT", "https://api.openai.com/v1/audio/transcriptions")
STT_MODEL = os.getenv("STT_MODEL", "whisper-1")

# Transactional Email Service Configuration (Password Reset / Directives)
EMAIL_PROVIDER = os.getenv("EMAIL_PROVIDER", "console")  # smtp, sendgrid, console
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@gramx.gov.in")
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")

# Vector & Semantic Search Configuration
EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", "local")  # local, sentence-transformers, openai
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
VECTOR_DATABASE_URL = os.getenv("VECTOR_DATABASE_URL", "")

# Subdomain & Base Domain
GRAMX_BASE_DOMAIN = os.getenv("GRAMX_BASE_DOMAIN", "localhost")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Configurable MCDA weights for priority calculation
WEIGHT_CRITICALITY = float(os.getenv("WEIGHT_CRITICALITY", "0.35"))
WEIGHT_SEVERITY = float(os.getenv("WEIGHT_SEVERITY", "0.35"))
WEIGHT_POPULATION = float(os.getenv("WEIGHT_POPULATION", "0.20"))
WEIGHT_CONFIDENCE = float(os.getenv("WEIGHT_CONFIDENCE", "0.10"))

# Emergency override flags
EMERGENCY_LOCAL_STORAGE_OVERRIDE = os.getenv("EMERGENCY_LOCAL_STORAGE_OVERRIDE", "false").lower() == "true"


def validate_production_environment():
    """
    Enforces strict production requirements when APP_ENV == 'production'.
    Fails startup with explicit RuntimeError if managed services are not configured.
    """
    if APP_ENV != "production":
        return

    errors = []
    # 1. Database Guard: PostgreSQL required
    if DATABASE_URL.startswith("sqlite"):
        errors.append("Production requires PostgreSQL. SQLite is not permitted in production.")

    # 2. Storage Guard: Cloud Object Storage required
    if STORAGE_BACKEND == "local" and not EMERGENCY_LOCAL_STORAGE_OVERRIDE:
        errors.append("Production requires Cloud Object Storage (S3/R2/MinIO). Local storage is not permitted in production.")

    # 3. Email Guard: Transactional provider required (no console OTPs)
    if EMAIL_PROVIDER == "console":
        errors.append("Production requires a real transactional email provider (SMTP/SendGrid). ConsoleLogEmailAdapter is prohibited in production.")

    # 4. Secret Key Guard: No default dev secrets
    if SECRET_KEY == "dev_secret_key_for_gramx_mvp_token_signing_2026":
        errors.append("Production requires a cryptographically secure SECRET_KEY.")

    if errors:
        msg = "\n[GRAM-X CRITICAL STARTUP ERROR - PRODUCTION GUARD FAILURE]:\n" + "\n".join(f" - {e}" for e in errors)
        raise RuntimeError(msg)


