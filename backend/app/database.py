import logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import QueuePool, StaticPool
from app.config import (
    DATABASE_URL,
    DB_POOL_SIZE,
    DB_MAX_OVERFLOW,
    DB_POOL_TIMEOUT,
    DB_POOL_RECYCLE
)

logger = logging.getLogger("gramx.database")

# Build connection parameters depending on the database backend (PostgreSQL vs SQLite)
is_sqlite = DATABASE_URL.startswith("sqlite")
is_postgres = DATABASE_URL.startswith("postgres") or DATABASE_URL.startswith("postgresql")

engine_kwargs = {}

if is_sqlite:
    # SQLite configuration for local development / testing
    engine_kwargs["connect_args"] = {"check_same_thread": False}
    # If in-memory SQLite, use StaticPool
    if ":memory:" in DATABASE_URL:
        engine_kwargs["poolclass"] = StaticPool
else:
    # Enterprise PostgreSQL Connection Pool Configuration
    engine_kwargs["poolclass"] = QueuePool
    engine_kwargs["pool_size"] = DB_POOL_SIZE
    engine_kwargs["max_overflow"] = DB_MAX_OVERFLOW
    engine_kwargs["pool_timeout"] = DB_POOL_TIMEOUT
    engine_kwargs["pool_recycle"] = DB_POOL_RECYCLE
    engine_kwargs["pool_pre_ping"] = True  # Automatically test connections on checkout to handle dropped connections

engine = create_engine(DATABASE_URL, **engine_kwargs)

# Enforce foreign key constraints and WAL journal mode for SQLite connections
if is_sqlite:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_db_health() -> dict:
    """Verifies that the database pool is healthy and actively responding."""
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        pool_info = {
            "type": "sqlite" if is_sqlite else "postgresql",
            "dialect": engine.dialect.name,
            "status": "healthy",
            "pool_size": getattr(engine.pool, "size", lambda: 5)(),
            "checked_in_connections": getattr(engine.pool, "checkedin", lambda: 5)(),
            "checked_out_connections": getattr(engine.pool, "checkedout", lambda: 0)(),
            "overflow_connections": getattr(engine.pool, "overflow", lambda: 0)()
        }
        return pool_info
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "type": "sqlite" if is_sqlite else "postgresql",
            "dialect": engine.dialect.name if hasattr(engine, "dialect") else "unknown",
            "status": "unhealthy",
            "error": str(e)
        }

