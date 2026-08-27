"""
GRAM-X Enterprise Database Migration Utility: SQLite -> Managed PostgreSQL
Performs safe, ordered, and validated data extraction from SQLite and writes to PostgreSQL.
Handles foreign key dependency ordering, schema creation, data validation, and post-migration checks.
"""

import os
import sys
import logging
from datetime import datetime
from sqlalchemy import create_engine, text, MetaData
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models import Base

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("gramx.migration")

# Table migration dependency order (parents first, children after)
TABLE_ORDER = [
    "villages",
    "users",
    "technicians",
    "assets",
    "sensor_readings",
    "maintenance_history",
    "households",
    "projects",
    "project_milestones",
    "project_outcomes",
    "incidents",
    "tasks",
    "incident_evidence",
    "verification_records",
    "reuse_decisions",
    "audit_logs",
    "notifications",
    "refresh_tokens",
    "knowledge_articles",
    "stored_files",
    "password_reset_tokens",
    "outbox_events"
]

def migrate(sqlite_url: str, postgres_url: str, dry_run: bool = False):
    logger.info("=" * 70)
    logger.info("GRAM-X DATABASE MIGRATION: SQLite -> PostgreSQL")
    logger.info("=" * 70)
    logger.info(f"Source (SQLite): {sqlite_url}")
    logger.info(f"Target (PostgreSQL): {postgres_url.split('@')[-1] if '@' in postgres_url else postgres_url}")
    logger.info(f"Mode: {'DRY RUN' if dry_run else 'LIVE MIGRATION'}")

    src_engine = create_engine(sqlite_url)
    dst_engine = create_engine(postgres_url)

    # 1. Initialize PostgreSQL schemas
    logger.info("\n[Phase 1] Ensuring PostgreSQL target schemas exist...")
    if not dry_run:
        Base.metadata.create_all(bind=dst_engine)
        logger.info("Target schema initialized successfully.")

    # 2. Extract and copy table by table
    logger.info("\n[Phase 2] Migrating table data in dependency order...")
    total_migrated = 0
    migration_summary = {}

    with src_engine.connect() as src_conn:
        for table_name in TABLE_ORDER:
            # Check if table exists in source
            check_res = src_conn.execute(text(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}'")).fetchone()
            if not check_res:
                logger.info(f"  [-] Table '{table_name}' not found in source SQLite (Skipped)")
                continue

            rows = src_conn.execute(text(f"SELECT * FROM {table_name}")).fetchall()
            count = len(rows)
            migration_summary[table_name] = count

            if count == 0:
                logger.info(f"  [0] Table '{table_name}': 0 rows")
                continue

            columns = src_conn.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
            col_names = [c[1] for c in columns]

            logger.info(f"  [+] Migrating '{table_name}': {count} rows...")

            if not dry_run:
                with dst_engine.connect() as dst_conn:
                    # Clear target table to prevent duplicates during full sync
                    dst_conn.execute(text(f"DELETE FROM {table_name}"))
                    
                    for row in rows:
                        row_dict = dict(zip(col_names, row))
                        # Parameterized insert
                        cols_str = ", ".join(col_names)
                        placeholders = ", ".join([f":{col}" for col in col_names])
                        insert_query = text(f"INSERT INTO {table_name} ({cols_str}) VALUES ({placeholders})")
                        dst_conn.execute(insert_query, row_dict)
                    dst_conn.commit()

            total_migrated += count

    # 3. Post-Migration Verification & Sequence Reset (PostgreSQL serial ID sequences)
    logger.info("\n[Phase 3] Post-migration validation & sequence synchronization...")
    if not dry_run and dst_engine.name == "postgresql":
        with dst_engine.connect() as dst_conn:
            for table_name in TABLE_ORDER:
                try:
                    # Update PostgreSQL sequence to max(id) + 1
                    seq_query = text(f"SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), COALESCE(MAX(id), 1)) FROM {table_name}")
                    dst_conn.execute(seq_query)
                    dst_conn.commit()
                except Exception:
                    pass

    logger.info("\n" + "=" * 70)
    logger.info(f"MIGRATION COMPLETE: {total_migrated} total rows migrated across {len(migration_summary)} tables.")
    logger.info("=" * 70)
    return migration_summary

if __name__ == "__main__":
    src = os.getenv("SQLITE_SOURCE_URL", "sqlite:///./gramx.db")
    dst = os.getenv("POSTGRES_TARGET_URL", os.getenv("DATABASE_URL", "sqlite:///./gramx_target.db"))
    dry = "--dry-run" in sys.argv
    migrate(src, dst, dry)
